"""Audit native exports against full extracted Time Stranger sources and disc keys.
Usage: python -I tools/ts_native_audit.py TS_DIR WEB [--extracted DISC_DIR]
       [--config tools/custom_cards.json] [--out audit.json] [--cards 303 307]
Only reads source/game assets. Reports conservation, no proprietary source payload.
"""
import argparse,gzip,json,os,sys
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import ts_model_read as T
import ts_anim_read as A
import ts_model as M
import ts_native_model as N
import custom,build_data


def equal(actual,expected,label,exact=False):
    try:
        if exact:np.testing.assert_array_equal(actual,expected)
        else:np.testing.assert_allclose(actual,expected,rtol=1e-7,atol=1e-7)
    except AssertionError as error:raise AssertionError(label+': '+str(error)) from error


def audit_card(card,source,web,game=None):
    choice=card['model'];num=choice['number']
    model=json.loads(gzip.decompress((web/'assets/models'/('%03d.bin.gz'%num)).read_bytes()))
    assert model['format']=='ts-native-v1' and model['fullSkin']
    g=T.read_geom(str(source/(choice['ts']+'.geom')))
    bones=g['bones'];n=len(bones)
    assert model['n']==n
    assert model['names']==[b['name'] for b in bones]
    equal(model['parents'],[b['parent'] for b in bones],'all parents',True)
    equal(np.array(model['restQuaternion']).reshape(n,4),[b['rotation'] for b in bones],'rest rotations')
    equal(np.array(model['restScale']).reshape(n,3),[b['scale'] for b in bones],'rest scales')
    base_number=model['baseModel']
    if game is not None:assert custom.base_of(card,game)['model']==base_number
    base=M.read_dm(str(web/'assets/models'/('%03d.bin.gz'%base_number)))
    against=str(source/(choice['against']+'.geom')) if choice.get('against') else None
    scale,shift,c,_,_=N.coordinate_transform(g,base,against,choice.get('size',1.),choice.get('ground'))
    equal(model['scale'],scale,'fit scale');equal(model['shift'],shift,'fit shift')
    offsets=-scale*np.asarray([b['position'] for b in bones],float)
    offsets[[i for i,b in enumerate(bones) if b['parent']<0]]+=shift
    equal(np.array(model['offsets']).reshape(n,3),offsets,'all local offsets')
    basis=c.copy();basis[:3,3]=0.;ci=np.linalg.inv(c)
    ibm=np.array(model['inverseBind']).reshape(n,4,4)
    equal(ibm,[basis@b['inverse_bind']@ci for b in bones],'affine inverse binds')
    for anchor,name in choice.get('parts',{}).items():assert model['anchors'][anchor]==model['names'].index(name)
    drawn=T.drawn(g,False);assert len(drawn)==len(model['meshes'])
    vertices=triangles=0
    for source_mesh,mesh in zip(drawn,model['meshes']):
        attr=source_mesh['attributes'];nv=source_mesh['vertices']
        assert mesh['name']==source_mesh['name']
        equal(np.array(mesh['positions']).reshape(nv,3),-scale*np.asarray(attr['POSITION'][:,:3],float)+shift,'full positions including unused')
        equal(np.array(mesh['normals']).reshape(nv,3),-attr['NORMAL'],'full normals')
        equal(np.array(mesh['indices']).reshape(-1,3),source_mesh['triangles'][:,::-1],'every source triangle',True)
        # Check rigid palette choice and all four weight slots, including unused vertices.
        joints,weights=N.mesh_skin(source_mesh)
        equal(np.array(mesh['joints']).reshape(nv,4),joints,'all original bone ids',True)
        equal(np.array(mesh['weights']).reshape(nv,4),weights,'all normalized source weights')
        for key in ('TEXCOORD0','TEXCOORD1','TEXCOORD2'):
            if key in attr:equal(np.array(mesh['sourceUv'+key[-1]]).reshape(nv,2),attr[key],'full '+key)
        material=model['materials'][mesh['material']]
        expected,uvkey,_=N.native_texture(g['materials'][source_mesh['material']],attr,str(source/'images'))
        actual=Image.open(web/'assets/models'/material['texture'])
        assert actual.mode=='RGBA' and actual.size==expected.size==(material['width'],material['height'])
        equal(np.asarray(actual),np.asarray(expected),'native RGBA pixels',True)
        equal(np.array(mesh['uv0']).reshape(nv,2),attr[uvkey],'selected native UV')
        vertices+=nv;triangles+=len(source_mesh['triangles'])
    assert vertices==model['nv'] and triangles==model['nt']
    assert len(model['motions'])==len(base['motions'])==8
    tested_poses=0
    for slot,(motion,keys) in enumerate(zip(model['motions'],base['motions'])):
        assert len(motion['keys'])==len(keys)
        for made,key in zip(motion['keys'],keys):
            assert made['dur']==key['dur'] and made['snd']==key['snd']
            r=np.array(made['r']).reshape(n+1,11)
            equal(r[-1],key['recs'][-1],'disc camera',True)
            equal(r[:n,10],np.repeat(key['recs'][0][10],n),'disc next-key links',True)
        anim=A.read(str(source/(choice['ts']+'_'+motion['source']+'.anim'))) if motion['source'] else None
        if not anim:continue
        frames,_=N.key_frames(keys,anim,g,scale,shift,lambda _:None,'audit')
        for k in sorted({0,len(keys)//2,len(keys)-1}):
            made=motion['keys'][k];r=np.array(made['r']).reshape(n+1,11);q=np.array(made['q']).reshape(n,4)
            world=T.rest_world([dict(parent=b['parent'],rotation=q[i],position=offsets[i]+r[i,4:7],scale=r[i,7:10]/4096) for i,b in enumerate(bones)])
            posed=A.posed(g,A.sample(anim,frames[k]))
            # Stored float32 quaternions can be off-unit by a few ULPs. The runtime
            # uses unit quaternions; normalize the reference without changing its pose.
            for b in posed:
                rotation=np.asarray(b['rotation'],float)
                b['rotation']=rotation/max(np.linalg.norm(rotation),1e-20)
            original=T.rest_world(posed)
            # Every bone's complete affine skin, not only a root or dominant weight.
            equal([world[i]@ibm[i]@c for i in range(n)],
                  [c@original[i]@bones[i]['inverse_bind'] for i in range(n)],'source/site posed skin matrices')
            tested_poses+=1
    return {'card':card['id'],'name':card['name'],'number':num,'source':choice['ts'],
            'bones':n,'meshes':len(drawn),'vertices':vertices,'triangles':triangles,
            'rgbaMaterials':len(model['materials']),'sampledPoses':tested_poses,
            'checks':['skeleton','full geometry','four weights and rigid palettes','all UVs',
                      'native RGBA dimensions and pixels','eight base timelines/sounds/cameras',
                      'source/site affine skin equivalence'],'passed':True}


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('ts');p.add_argument('web')
    p.add_argument('--extracted');p.add_argument('--config',default=str(Path(__file__).with_name('custom_cards.json')))
    p.add_argument('--out');p.add_argument('--cards',nargs='*',type=int)
    args=p.parse_args();data=json.loads(Path(args.config).read_text(encoding='utf-8'))
    game=build_data.build_cards((Path(args.extracted)/'drv/B/CARD2.CDD').read_bytes()) if args.extracted else None
    reports=[]
    for card in data['cards']:
        if not card.get('model',{}).get('native') or (args.cards and card['id'] not in args.cards):continue
        result=audit_card(card,Path(args.ts),Path(args.web),game);reports.append(result)
        print('%d %s: full source retained, %d bones, %d vertices, %d triangles, %d posed checks'%(card['id'],card['name'],result['bones'],result['vertices'],result['triangles'],result['sampledPoses']))
    report={'format':'ts-native-source-audit-v1','models':len(reports),'allPassed':bool(reports) and all(x['passed'] for x in reports),'results':reports}
    if args.out:Path(args.out).write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print('audit passed: %d native models'%len(reports))

if __name__=='__main__':main()
