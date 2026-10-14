"""Export full Time Stranger geometry, four-weight skin, skeleton and RGBA textures.

Project format ts-native-v1: gzip-compressed JSON, no disc polygon/part/atlas budgets.
All drawn meshes and bones are retained. Eight slots keep the disc base's key times,
sounds and cameras; poses are native local quaternions, positions and scales.
Run python -I tools/ts_native_model.py GEOM WEB BASE OUT NUMBER [--part N=BONE]
[--motion SLOT=NAME] [--against BASE_GEOM] [--size K] [--ground SOURCE_Y] [--stats FILE].
The source shaders remain unread. Eye overlays use the documented reader heuristic.
"""
import argparse,gzip,json,os,sys
import numpy as np
from PIL import Image
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import ts_model_read as T
import ts_anim_read as A
import ts_model as M


def flat(a):
    return np.asarray(a).reshape(-1).tolist()


def coordinate_transform(g,base,against=None,size=1.,ground=None):
    p=T.drawn_positions(g)
    lo,hi=p.min(0),p.max(0)
    measure=M.source_height(against) if against else float(hi[1]-lo[1])
    if measure<=0:raise ValueError('source/base height must be positive')
    scale=float((base['hi'][1]-base['lo'][1])/measure*size)
    floor=float(lo[1]) if ground is None else float(ground)
    if not np.isfinite(floor):raise ValueError('source ground must be finite')
    shift=np.array([0.,float(base['hi'][1]+floor*scale),0.])
    c=np.eye(4);c[:3,:3]*=-scale;c[:3,3]=shift
    return scale,shift,c,lo,hi


def native_texture(material,attributes,images):
    """Full native resolution, RGBA; eye composition matches the settled reader."""
    colour=T.param(material,'ColorSampler')
    lidname=T.param(material,'OverlayColorSampler2')
    eyename=T.param(material,'OverlayColorSampler')
    if lidname and eyename and 'TEXCOORD2' in attributes:
        lid=T.load_image(images,lidname).convert('RGBA')
        eye=T.load_image(images,eyename).convert('RGBA').resize(lid.size)
        a=np.asarray(lid).astype(float);b=np.asarray(eye).astype(float)
        k=(b[...,3:]/255.)*(1-a[...,3:]/255.)
        rgb=(a[...,:3]*(1-k)+b[...,:3]*k).astype(np.uint8)
        rgba=np.concatenate([rgb,np.full(rgb.shape[:2]+(1,),255,np.uint8)],2)
        return Image.fromarray(rgba,'RGBA'),'TEXCOORD2',{'colour':colour,'lid':lidname,'eye':eyename}
    return T.load_image(images,colour).convert('RGBA'),'TEXCOORD0',{'colour':colour}


def mesh_skin(mesh):
    a=mesh['attributes'];nv=mesh['vertices']
    joints=np.zeros((nv,4),np.int64);weights=np.zeros((nv,4),float)
    if 'BLENDINDICES' in a:
        indices=np.asarray(a['BLENDINDICES'],np.int64)
        sourceweights=np.asarray(a['BLENDWEIGHT'],float)
        if indices.shape[1]>4:raise ValueError('more than four source skin weights')
        joints[:,:indices.shape[1]]=np.asarray(mesh['palette'],np.int64)[indices]
        weights[:,:sourceweights.shape[1]]=sourceweights
        total=weights.sum(1)
        if np.any(total<=0):
            # Unused zero-weight source vertices have no skin contribution.
            weights[total>0]/=total[total>0,None]
        else:weights/=total[:,None]
    else:
        joints[:,0]=T.rigid_bones(mesh);weights[:,0]=1.
    return joints,weights


def local_pose(g,anim,frame,scale,shift):
    posed=A.posed(g,A.sample(anim,frame))
    q=np.asarray([b['rotation'] for b in posed],float)
    q/=np.maximum(np.linalg.norm(q,axis=1,keepdims=True),1e-20)
    p=-scale*np.asarray([b['position'] for b in posed],float)
    p[[i for i,b in enumerate(posed) if b['parent']<0]]+=shift
    s=np.asarray([b['scale'] for b in posed],float)
    return q,p,s


def key_frames(keys,anim,g,scale,shift,log,label):
    last=anim['frames']-1
    if len(keys)==1 or last==0:return [0.]*len(keys),'one pose'
    d=[2*k['dur'] for k in keys];times=np.cumsum([0]+d[1:])
    if int(keys[0]['recs'][0][10])==0:
        qa,pa,sa=local_pose(g,anim,0,scale,shift)
        qb,pb,sb=local_pose(g,anim,last,scale,shift)
        angles=np.arccos(np.clip(np.abs((qa*qb).sum(1)),-1.,1.))*4096/np.pi
        apart=max(float(angles.max()),float(np.abs(pa-pb).max()),float(np.abs(sa-sb).max()*4096))
        if apart<3:
            return list(times/(times[-1]+d[0])*last),'round, return to key 0 counted in'
        log('%s loops in base but source endpoints differ %.3f; join remains a blend'%(label,apart))
    return list(times/times[-1]*last),'first frame to last'


def native_motions(g,base,prefix,chosen,scale,shift,offsets,log):
    out,notes,cache=[],[],{}
    n=len(g['bones'])
    def load(name):
        if name not in cache:
            f=prefix+name+'.anim';cache[name]=A.read(f) if os.path.exists(f) else None
        return cache[name]
    for slot,keys in enumerate(base['motions']):
        names=M.slot_names(slot,chosen)
        name=next((x for x in names if load(x) is not None),None)
        anim=load(name) if name else None
        if anim is not None and anim['bones']!=n:raise ValueError('motion skeleton differs from source')
        if name and name!=names[0]:log('slot %d: no %s; %s takes its place'%(slot,names[0],name))
        frames,how=key_frames(keys,anim,g,scale,shift,log,'slot %d (%s)'%(slot,name)) if anim else ([0.]*len(keys),'bind pose held')
        made=[]
        for key,frame in zip(keys,frames):
            if anim:q,p,s=local_pose(g,anim,frame,scale,shift)
            else:
                q=np.asarray([b['rotation'] for b in g['bones']],float)
                p=np.asarray(offsets,float);s=np.asarray([b['scale'] for b in g['bones']],float)
            r=np.zeros((n+1,11),float)
            r[:n,4:7]=p-offsets;r[:n,7:10]=s*4096
            r[:n,10]=float(key['recs'][0][10])
            r[n]=key['recs'][-1]
            made.append({'dur':int(key['dur']),'snd':int(key['snd']),'r':flat(r),'q':flat(q)})
        out.append({'source':name,'loop':int(keys[0]['recs'][0][10]),'keys':made})
        duration=2*keys[0]['dur']+sum(2*k['dur'] for k in keys)
        notes.append({'slot':slot,'source':name,'frames':duration,'sampleFrames':[float(f) for f in frames],'how':how})
        log('slot %d: %s, %d source frames on %d base keys over %d frames (%s)'%(slot,name,anim['frames'] if anim else 0,len(keys),duration,how))
    return out,notes


def build(geom,web,base_num,num,fixed=None,chosen=None,images=None,anims=None,against=None,size=1.,log=print,ground=None):
    g=T.read_geom(geom);base=M.read_dm(os.path.join(web,'assets','models','%03d.bin.gz'%base_num))
    images=images or os.path.join(os.path.dirname(os.path.abspath(geom)),'images')
    prefix=anims or os.path.splitext(geom)[0]+'_'
    scale,shift,c,lo,hi=coordinate_transform(g,base,against,size,ground)
    ci=np.linalg.inv(c);basis=c.copy();basis[:3,3]=0.
    bones=g['bones'];n=len(bones)
    parents=[int(b['parent']) for b in bones]
    offsets=-scale*np.asarray([b['position'] for b in bones],float)
    offsets[[i for i,p in enumerate(parents) if p<0]]+=shift
    # Bone coordinates include the root shift; their basis has no translation.
    # C on the left would apply the site shift a second time during skinning.
    inverse=np.asarray([basis@b['inverse_bind']@ci for b in bones])
    names=[b['name'] for b in bones];lookup={name:i for i,name in enumerate(names)}
    anchors={str(i):lookup[name] for i,name in (fixed or {}).items()}
    if '0' not in anchors:
        anchors['0']=lookup.get('J_center',lookup.get('spine',0))
    materials=[];meshes=[];textures=[];materialmap={}
    source_vertices=source_triangles=0
    for mesh in T.drawn(g,False):
        a=mesh['attributes'];source_material=g['materials'][mesh['material']]
        key=(mesh['material'],'TEXCOORD2' in a)
        if key not in materialmap:
            image,uvkey,sources=native_texture(source_material,a,images)
            index=len(materials);path='%03d-%d.png'%(num,index)
            materials.append({'texture':path,'width':image.width,'height':image.height,'source':sources,'name':source_material['name']})
            textures.append((path,image));materialmap[key]=(index,uvkey)
        index,uvkey=materialmap[key];joints,weights=mesh_skin(mesh)
        positions=-scale*np.asarray(a['POSITION'][:,:3],float)+shift
        normals=-np.asarray(a['NORMAL'],float)
        uv=np.asarray(a[uvkey],float)
        rec={'name':mesh['name'],'material':index,'positions':flat(positions),'normals':flat(normals),'uv0':flat(uv),'indices':flat(np.asarray(mesh['triangles'])[:,::-1]),'joints':flat(joints),'weights':flat(weights)}
        for k in ('TEXCOORD0','TEXCOORD1','TEXCOORD2'):
            if k in a:rec['sourceUv'+k[-1]]=flat(a[k])
        meshes.append(rec);source_vertices+=mesh['vertices'];source_triangles+=len(mesh['triangles'])
    motions,notes=native_motions(g,base,prefix,chosen or {},scale,shift,offsets,log)
    model={'format':'ts-native-v1','version':3,'fullSkin':True,'source':os.path.basename(geom),'n':n,'nv':source_vertices,'nt':source_triangles,'names':names,'parents':parents,'offsets':flat(offsets),'inverseBind':flat(inverse),'anchors':anchors,'meshes':meshes,'materials':materials,'motions':motions,'scale':scale,'shift':flat(shift),'ground':ground,'baseModel':int(base_num),'restQuaternion':flat([b['rotation'] for b in bones]),'restScale':flat([b['scale'] for b in bones])}
    if against:log('source/base full bind height ratio %.3f'%float((hi[1]-lo[1])/M.source_height(against)))
    log('native full source: %d bones, %d vertices, %d triangles, %d materials; scale %.3f, height %.3f -> %.3f'%(n,source_vertices,source_triangles,len(materials),scale,hi[1]-lo[1],(hi[1]-lo[1])*scale))
    stats={'number':num,'source':model['source'],'base':base_num,'bones':n,'vertices':source_vertices,'triangles':source_triangles,'materials':[{k:m[k] for k in ('texture','width','height','name')} for m in materials],'anchors':{k:names[i] for k,i in anchors.items()},'scale':scale,'ground':ground,'height':float((hi[1]-lo[1])*scale),'motionSlots':notes}
    return model,textures,stats


def make(geom,web,base_num,out_dir,num,fixed=None,chosen=None,images=None,anims=None,against=None,size=1.,log=print,ground=None):
    model,textures,stats=build(geom,web,base_num,num,fixed,chosen,images,anims,against,size,log,ground)
    data=json.dumps(model,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode('utf-8')
    os.makedirs(out_dir,exist_ok=True)
    for path,image in textures:image.save(os.path.join(out_dir,path),'PNG',optimize=True)
    with open(os.path.join(out_dir,'%03d.bin.gz'%num),'wb') as f:f.write(gzip.compress(data,9,mtime=0))
    return model,stats


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('geom');p.add_argument('web');p.add_argument('base',type=int);p.add_argument('out');p.add_argument('number',type=int)
    p.add_argument('--part',action='append',default=[]);p.add_argument('--motion',action='append',default=[])
    p.add_argument('--against');p.add_argument('--size',type=float,default=1.);p.add_argument('--ground',type=float);p.add_argument('--stats')
    a=p.parse_args();fixed={int(k):v for k,v in (x.split('=',1) for x in a.part)};chosen={int(k):v for k,v in (x.split('=',1) for x in a.motion)}
    _,stats=make(a.geom,a.web,a.base,a.out,a.number,fixed,chosen,against=a.against,size=a.size,ground=a.ground)
    if a.stats:
        with open(a.stats,'w',encoding='utf-8') as f:json.dump(stats,f,indent=2)
    print(json.dumps(stats,separators=(',',':')))

if __name__=='__main__':main()
