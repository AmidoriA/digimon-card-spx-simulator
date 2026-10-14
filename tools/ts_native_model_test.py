"""Native exporter semantic regressions, using synthetic bones/meshes only."""
import os,sys,copy,json,gzip,io,unittest
from unittest.mock import patch
import numpy as np
from PIL import Image
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import ts_native_model as N
import ts_model_read as T
import ts_anim_read as A


def fixture():
    bones=[dict(name='root',parent=-1,rotation=(0.,0.,0.,1.),position=(0.,0.,0.),scale=(1.,1.,1.)),
           dict(name='hand',parent=0,rotation=(0.,0.,0.,1.),position=(0.5,0.,0.),scale=(1.,1.,1.))]
    worlds=T.rest_world(bones)
    for bone,world in zip(bones,worlds):bone['inverse_bind']=np.linalg.inv(world)
    attr={'POSITION':np.array([[0.,0.,0.],[1.,0.,0.],[0.,1.,0.]],np.float32),
          'NORMAL':np.array([[0.,0.,1.]]*3,np.float32),
          'TEXCOORD0':np.array([[0.,0.],[1.,0.],[0.,1.]],np.float32),
          'BLENDINDICES':np.array([[0,1],[0,1],[0,1]],np.uint8),
          'BLENDWEIGHT':np.array([[0.25,0.75],[0.5,0.5],[0.75,0.25]],np.float32)}
    mesh={'name':'skin','vertices':3,'material':0,'palette':[0,1],'attributes':attr,'triangles':np.array([[0,1,2]],np.uint32)}
    g={'bones':bones,'meshes':[mesh],'materials':[{'name':'skin','params':[{'name':'ColorSampler','floats':0,'value':'native'}]}]}
    keys=[]
    for duration in (3,5):
        recs=np.zeros((2,11),int);recs[0,10]=-1;recs[-1]=np.arange(11)+123
        keys.append({'dur':duration,'snd':9,'recs':recs})
    base={'lo':np.array([0.,-10.,0.]),'hi':np.array([1.,0.,1.]),'motions':[keys]*8}
    anim={'bones':2,'frames':3,'static':{('rotation',1):(0.,0.,0.7071067811865476,0.7071067811865476),('position',1):(0.125,0.25,0.),('scale',1):(0.,1.,1.)},'keys':{}}
    pixels=np.arange(3*5*4,dtype=np.uint8).reshape(3,5,4)
    image=Image.fromarray(pixels,'RGBA')
    return g,base,anim,image


def build_fixture(ground=None):
    g,base,anim,image=fixture()
    with patch.object(T,'read_geom',return_value=g),patch.object(N.M,'read_dm',return_value=base),patch.object(T,'load_image',return_value=image),patch.object(N.os.path,'exists',return_value=True),patch.object(A,'read',return_value=anim):
        model,textures,stats=N.build('synthetic.geom','unused',3,901,{0:'root',6:'hand',9:'hand'},log=lambda _:None,ground=ground)
    return g,base,anim,image,model,textures,stats


class NativeExporterTests(unittest.TestCase):
    def test_geometry_full_weights_bones_and_anchor_aliases_retained(self):
        g,_,_,_,m,_,_=build_fixture()
        self.assertEqual(m['n'],2);self.assertEqual(m['nv'],3);self.assertEqual(m['nt'],1)
        self.assertEqual(m['anchors'],{'0':0,'6':1,'9':1})
        mesh=m['meshes'][0]
        np.testing.assert_array_equal(np.array(mesh['joints']).reshape(-1,4)[:,:2],[[0,1]]*3)
        np.testing.assert_allclose(np.array(mesh['weights']).reshape(-1,4)[:,:2],g['meshes'][0]['attributes']['BLENDWEIGHT'])
        np.testing.assert_array_equal(mesh['indices'],[2,1,0])
        np.testing.assert_array_equal(np.array(mesh['sourceUv0']).reshape(-1,2),g['meshes'][0]['attributes']['TEXCOORD0'])
    def test_native_rgba_resolution_and_every_channel_retained(self):
        _,_,_,source,model,textures,_=build_fixture()
        self.assertEqual(model['materials'][0]['width'],5);self.assertEqual(model['materials'][0]['height'],3)
        np.testing.assert_array_equal(np.asarray(textures[0][1]),np.asarray(source))
    def test_native_site_skinning_matches_source_even_with_zero_scale(self):
        g,_,anim,_,m,_,_=build_fixture(ground=0.25);key=m['motions'][0]['keys'][0]
        r=np.array(key['r']).reshape(m['n']+1,11);q=np.array(key['q']).reshape(m['n'],4);off=np.array(m['offsets']).reshape(-1,3)
        sitebones=[dict(parent=m['parents'][i],rotation=q[i],position=off[i]+r[i,4:7],scale=r[i,7:10]/4096) for i in range(m['n'])]
        posedsite=T.rest_world(sitebones);ibm=np.array(m['inverseBind']).reshape(-1,4,4)
        srcworld=T.rest_world(A.posed(g,A.sample(anim,0)))
        mesh=m['meshes'][0];p=np.column_stack([np.array(mesh['positions']).reshape(-1,3),np.ones(3)])
        js=np.array(mesh['joints']).reshape(-1,4);ws=np.array(mesh['weights']).reshape(-1,4)
        actual=np.zeros((3,4));expected_source=np.zeros((3,4));sp=np.column_stack([g['meshes'][0]['attributes']['POSITION'],np.ones(3)])
        for v in range(3):
            for slot in range(4):
                bone=js[v,slot];weight=ws[v,slot]
                actual[v]+=weight*(posedsite[bone]@ibm[bone]@p[v])
                expected_source[v]+=weight*(srcworld[bone]@g['bones'][bone]['inverse_bind']@sp[v])
        expected=expected_source.copy();expected[:,:3]=-m['scale']*expected[:,:3]+m['shift']
        np.testing.assert_allclose(actual,expected,atol=1e-12)
    def test_base_key_timing_sounds_camera_and_float_motion_preserved(self):
        _,base,_,_,m,_,_=build_fixture()
        self.assertEqual(len(m['motions']),8)
        for motion in m['motions']:
            self.assertEqual([k['dur'] for k in motion['keys']],[3,5])
            self.assertEqual([k['snd'] for k in motion['keys']],[9,9])
            for key in motion['keys']:
                r=np.array(key['r']).reshape(3,11)
                np.testing.assert_array_equal(r[-1],base['motions'][0][0]['recs'][-1])
                self.assertAlmostEqual(np.linalg.norm(np.array(key['q']).reshape(2,4)[1]),1.)
    def test_ground_override_preserves_affine_skin_and_fit_scale(self):
        g,base,anim,image=fixture()
        normal=N.coordinate_transform(g,base)
        shifted=N.coordinate_transform(g,base,ground=0.25)
        self.assertEqual(normal[0],shifted[0])
        self.assertEqual(shifted[1][1],base['hi'][1]+0.25*shifted[0])
        c=shifted[2];ci=np.linalg.inv(c);basis=c.copy();basis[:3,3]=0.
        sourceworld=T.rest_world(A.posed(g,A.sample(anim,0)))
        q,p,s=N.local_pose(g,anim,0,shifted[0],shifted[1])
        siteworld=T.rest_world([dict(parent=b['parent'],position=p[i],rotation=q[i],scale=s[i]) for i,b in enumerate(g['bones'])])
        for i,b in enumerate(g['bones']):
            np.testing.assert_allclose(siteworld[i]@(basis@b['inverse_bind']@ci)@c,
                                       c@sourceworld[i]@b['inverse_bind'],atol=1e-12)

    def test_four_weights_sparse_palette_and_unused_zero_weights_retained(self):
        mesh={'vertices':2,'palette':[8,2,7,5],'attributes':{
            'BLENDINDICES':np.array([[0,1,2,3],[3,2,1,0]]),
            'BLENDWEIGHT':np.array([[0.1,0.2,0.3,0.4],[0.,0.,0.,0.]])}}
        joints,weights=N.mesh_skin(mesh)
        np.testing.assert_array_equal(joints,[[8,2,7,5],[5,7,2,8]])
        np.testing.assert_array_equal(weights,mesh['attributes']['BLENDWEIGHT'])

    def test_unused_outlier_does_not_change_rendered_fit(self):
        g,base,_,_=fixture()
        expected=N.coordinate_transform(g,base)
        mesh=g['meshes'][0]
        mesh['attributes']['POSITION']=np.concatenate([mesh['attributes']['POSITION'],[[999.,-999.,999.]]])
        mesh['vertices']=4
        actual=N.coordinate_transform(g,base)
        for before,after in zip(expected,actual):np.testing.assert_array_equal(before,after)
        with patch.object(T,'read_geom',return_value=g):
            self.assertEqual(N.M.source_height('synthetic.geom'),1.)

    def test_write_is_gzip_json_not_legacy_palette_format(self):
        *_,model,textures,stats=build_fixture()
        class Buffer(io.BytesIO):
            def close(self):pass
        stream=Buffer()
        with patch.object(N,'build',return_value=(model,textures,stats)),patch.object(N.os,'makedirs'),patch.object(N,'open',return_value=stream,create=True),patch.object(Image.Image,'save') as save:
            N.make('synthetic.geom','unused',3,'unused',901)
        raw=gzip.decompress(stream.getvalue());self.assertTrue(raw.startswith(b'{'))
        self.assertEqual(json.loads(raw)['format'],'ts-native-v1')
        self.assertEqual(save.call_count,len(textures))

if __name__=='__main__':unittest.main(verbosity=2)
