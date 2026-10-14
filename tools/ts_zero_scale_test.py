"""Regression checks for native zero-scale motion channels and bone-space skinning.
No extracted files are required. Optional native audit: <app_0 directory>.
"""
import math
import os
import sys
import unittest
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ts_model as M
import ts_model_read as T
import ts_anim_read as A


def fixture(children=True):
    bones = [dict(name='root', parent=-1, rotation=(0, 0, 0, 1),
                  position=(2, 3, 4), scale=(1, 1, 1))]
    if children:
        bones.append(dict(name='child', parent=0, rotation=(0, 0, 0, 1),
                          position=(1, 2, 3), scale=(1, 1, 1)))
    world = T.rest_world(bones)
    for b, w in zip(bones, world):
        b['inverse_bind'] = np.linalg.inv(w)
    g = {'bones': bones}
    centre = np.array([-w[:3, 3] * 100 for w in world])
    parts = [(b['parent'], centre[i] - (centre[b['parent']] if b['parent'] >= 0 else 0))
             for i, b in enumerate(bones)]
    return dict(geom=g, bones=list(range(len(bones))), parts=parts, centre=centre,
                flip=np.array([-1., -1., -1.]), shift=np.zeros(3), scale=100.)


def records(m, pose):
    r = np.zeros((len(pose) + 1, 11))
    for i, (rotation, move, scale) in enumerate(pose):
        r[i, :3] = rotation
        r[i, 4:7] = move
        r[i, 7:10] = scale * 4096
    return r


def audit_vertices(m, anim, points, bones):
    p = np.column_stack([points, np.ones(len(points))])
    world = T.rest_world(A.posed(m['geom'], A.sample(anim, 0)))
    expected = np.array([(world[b] @ m['geom']['bones'][b]['inverse_bind'] @ x)[:3]
                         * m['flip'] * m['scale'] + m['shift'] for x, b in zip(p, bones)])
    verts = np.zeros((len(points), 13), dtype=np.int64)
    for i, (point, b) in enumerate(zip(points, bones)):
        verts[i, :3] = point * m['flip'] * m['scale'] + m['shift'] - m['centre'][b]
        verts[i, 11] = b
    result = M.posed_dm(m['parts'], verts, records(m, M.part_pose(m, anim, 0)))
    np.testing.assert_allclose(result, expected, atol=1e-7)


class ZeroScaleTests(unittest.TestCase):
    def test_root_zero_scale_keeps_rotation_translation_and_hidden_geometry(self):
        m = fixture(False)
        a = {'static': {('scale', 0): (0, 0, 0), ('position', 0): (5, -2, 1),
                        ('rotation', 0): (0, 0, math.sin(.3), math.cos(.3))}, 'keys': {}}
        pose = M.part_pose(m, a, 0)
        self.assertTrue(np.isfinite(np.concatenate(pose[0])).all())
        np.testing.assert_array_equal(pose[0][2], [0, 0, 0])
        audit_vertices(m, a, np.array([[3., 3., 4.], [2., 4., 4.]]), [0, 0])

    def test_child_of_zero_scale_parent_collapses_at_source_parent_translation(self):
        m = fixture()
        a = {'static': {('scale', 0): (0, 0, 0), ('position', 0): (2, -1, 5),
                        ('rotation', 1): (0, math.sin(.4), 0, math.cos(.4))}, 'keys': {}}
        pose = M.part_pose(m, a, 0)
        self.assertTrue(all(np.isfinite(np.concatenate(x)).all() for x in pose))
        np.testing.assert_array_equal(pose[0][2], [0, 0, 0])
        audit_vertices(m, a, np.array([[3., 5., 7.], [4., 6., 8.]]), [1, 1])

    def test_one_collapsed_axis_preserves_visible_axes(self):
        m = fixture(False)
        a = {'static': {('scale', 0): (2, 0, 3),
                        ('rotation', 0): (0, 0, math.sin(.3), math.cos(.3))}, 'keys': {}}
        pose = M.part_pose(m, a, 0)
        np.testing.assert_allclose(pose[0][2], [2, 0, 3], atol=1e-12)
        audit_vertices(m, a, np.array([[3., 4., 5.], [1., 2., 3.]]), [0, 0])

    def test_nonsingular_pose_still_matches_source(self):
        m = fixture()
        a = {'static': {('position', 0): (1, -2, 3),
                        ('rotation', 0): (0, 0, math.sin(.2), math.cos(.2)),
                        ('rotation', 1): (0, math.sin(.4), 0, math.cos(.4))}, 'keys': {}}
        audit_vertices(m, a, np.array([[3., 3., 4.], [3., 5., 7.], [4., 5., 8.]]), [0, 1, 1])

    def test_weighted_bone_local_vertices_match_source_skin_with_nonuniform_scales(self):
        m = fixture(); g = m['geom']
        a = {'static': {('scale', 0): (2, .5, 3),
                        ('rotation', 0): (0, 0, math.sin(.2), math.cos(.2)),
                        ('rotation', 1): (0, math.sin(.4), 0, math.cos(.4))}, 'keys': {}}
        world = T.rest_world(A.posed(g, A.sample(a, 0)))
        bind = np.array([3., 5., 7., 1.]); weights = [.25, .75]
        skin = sum(w * (world[b] @ g['bones'][b]['inverse_bind'] @ bind)
                   for b, w in enumerate(weights))
        local = [g['bones'][b]['inverse_bind'] @ bind for b in range(2)]
        native = sum(w * (world[b] @ local[b]) for b, w in enumerate(weights))
        np.testing.assert_allclose(native, skin, atol=1e-12)
        # The full affine matrices carry shear introduced by a scaled parent and
        # rotated child. Euler rotation plus independent column scales cannot.
        linear = world[1][:3, :3]
        axes = linear / np.linalg.norm(linear, axis=0)
        self.assertGreater(abs(float(axes[:, 0] @ axes[:, 2])), .1)


if __name__ == '__main__':
    unittest.main(verbosity=2)
