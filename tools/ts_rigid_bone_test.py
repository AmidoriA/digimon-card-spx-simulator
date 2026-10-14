"""Synthetic rigid vertex palette regressions. No extracted game files required."""
import os,sys,json,struct,io,unittest
from pathlib import Path
from unittest.mock import patch
import numpy as np
from PIL import Image
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import ts_model_read as T,ts_anim_read as A,ts_model as M

def fixture():
 bones=[dict(name='b%d'%i,parent=-1,rotation=(0,0,0,1),position=(0,0,0),scale=(1,1,1),inverse_bind=np.eye(4)) for i in range(3)]
 attrs={'POSITION':np.array([[0,0,0,0],[1,0,0,1],[0,1,0,0]],np.float32),'NORMAL':np.array([[0,0,1]]*3,np.float32),'TEXCOORD0':np.zeros((3,2),np.float32)}
 mesh={'name':'rigid','vertices':3,'material':0,'palette':[1,2],'attributes':attrs,'triangles':np.array([[0,1,2]],np.uint32)}
 mat={'name':'body','params':[{'name':'ColorSampler','floats':0,'value':'tex'}]}
 return dict(bones=bones,meshes=[mesh],materials=[mat])

class RigidPaletteTests(unittest.TestCase):
 def test_w_selects_palette_entry_not_homogeneous_coordinate(self):
  g=fixture();np.testing.assert_array_equal(T.rigid_bones(g['meshes'][0]),[1,2,1])
  g['meshes'][0]['attributes']['POSITION'][:,3]=1
  np.testing.assert_array_equal(T.rigid_bones(g['meshes'][0]),[2,2,2])
 def test_single_bone_three_component_mesh(self):
  g=fixture();m=g['meshes'][0];m['palette']=[2];m['attributes']['POSITION']=m['attributes']['POSITION'][:,:3]
  np.testing.assert_array_equal(T.rigid_bones(m),[2,2,2])
 def test_invalid_rigid_palette_values_are_refused(self):
  for v in [-1,2,0.25,float('nan')]:
   g=fixture();g['meshes'][0]['attributes']['POSITION'][0,3]=v
   with self.assertRaises(ValueError):T.rigid_bones(g['meshes'][0])
 def test_converter_source_keeps_each_rigid_bone(self):
  g=fixture()
  with patch.object(T,'load_image',return_value=Image.new('RGB',(2,2),'white')):
   np.testing.assert_array_equal(M.source(g,'unused')[2],[1,2,1])
 def test_pose_skin_moves_rigid_vertices_with_their_selected_bones(self):
  g=fixture();anim={'static':{('position',1):(10,0,0),('position',2):(0,20,0)},'keys':{}}
  with patch.object(T,'read_geom',return_value=g),patch.object(T,'draw',return_value=None):
   A.draw_pose('unused.geom',anim,0,'unused.png')
  np.testing.assert_allclose(g['meshes'][0]['attributes']['POSITION'],[[10,0,0],[1,20,0],[10,1,0]])
 def test_glb_joint_accessor_matches_rigid_palette(self):
  g=fixture()
  class Buffer(io.BytesIO):
   def close(self): pass
  buf=Buffer()
  with patch.object(T,'open',return_value=buf,create=True),patch.object(T,'load_image',return_value=Image.new('RGBA',(2,2),'white')):
   T.write_glb(g,'unused','synthetic.glb',False);blob=buf.getvalue()
  n=struct.unpack_from('<I',blob,12)[0];doc=json.loads(blob[20:20+n]);binary=20+n+8
  ai=doc['meshes'][0]['primitives'][0]['attributes']['JOINTS_0'];a=doc['accessors'][ai];v=doc['bufferViews'][a['bufferView']]
  got=np.frombuffer(blob,dtype='<u2',count=12,offset=binary+v['byteOffset']).reshape(3,4)
  np.testing.assert_array_equal(got[:,0],[1,2,1])

 def test_no_decimation_retains_source_triangle_geometry_and_uv(self):
  g=fixture()
  pos=np.array([[0,0,0],[1,0,0],[0,1,0]],float)
  uv=np.array([[0,0],[1,0],[0,1]],float)
  tris=np.array([[0,1,2],[2,1,0]])
  source=(pos,np.tile([0.,0.,1.],(3,1)),np.ones(3,int),uv,['skin']*3,tris,np.ones(2),{},0)
  base={'parts':1,'triangles':1,'width':16,'height':16,'rows':1,'lo':np.array([0.,-1.,0.]),'hi':np.array([1.,0.,1.])}
  captured=[]
  def bake(t,u,*args):
   captured.append((t.copy(),u.copy()));return np.zeros((3,2)),np.zeros(2,int),np.zeros((16,16),np.uint8),np.zeros((1,256,4),np.uint8)
  with patch.object(T,'read_geom',return_value=g),patch.object(M,'source',return_value=source),patch.object(M,'decimate',side_effect=AssertionError('must not reduce')),patch.object(M,'choose_parts',return_value=({1:0},[1])),patch.object(M,'motion_cost',return_value=None),patch.object(M,'bake',side_effect=bake):
   m=M.convert('synthetic.geom','unused',base,{},lambda _:None,no_decimate=True)
  np.testing.assert_array_equal(captured[0][1][captured[0][0]],uv[tris])
  self.assertEqual(len(m['tris']),2)
 def test_asset_overflow_is_refused_before_write(self):
  with patch.object(M.os,'makedirs') as mkdir:
   with self.assertRaisesRegex(ValueError,'16-bit asset'):
    M.write({'verts':np.zeros((65536,13),int),'tris':np.zeros((0,3),int)},[],'unused',999)
   mkdir.assert_not_called()

if __name__=='__main__':unittest.main(verbosity=2)
