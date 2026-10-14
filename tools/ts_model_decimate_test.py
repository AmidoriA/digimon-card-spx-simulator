"""Synthetic geometry regressions for TS model reduction (no extracted game files).

Run with tools/.venv Python: python -I tools/ts_model_decimate_test.py
Component/eye/seam protection is opt-in through preserve_seams=True; the default
retains the approved legacy conversion. Hard budgets apply to both modes.
These check retained surfaces/attributes, not a particular order of heap collapses.
"""
import os
import sys
import unittest
from unittest.mock import patch

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ts_model as M


def edges(tris, labels=None):
    """Undirected edges, optionally expressed by each corner's bone label."""
    return {tuple(sorted((int(labels[a] if labels is not None else a),
                          int(labels[b] if labels is not None else b))))
            for t in tris for a, b in zip(t, np.roll(t, -1))}


def grid():
    p = np.array([(x, y, 0) for y in range(3) for x in range(3)], float)
    t = np.array([[y * 3 + x, y * 3 + x + 1, (y + 1) * 3 + x + 1]
                  for y in range(2) for x in range(2)] +
                 [[y * 3 + x, (y + 1) * 3 + x + 1, (y + 1) * 3 + x]
                  for y in range(2) for x in range(2)])
    return p, t


def tetrahedron():
    return (np.array([[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]], float),
            np.array([[0, 2, 1], [0, 1, 3], [1, 2, 3], [2, 0, 3]]))


class DecimateTests(unittest.TestCase):
    def test_open_sheet_and_minimal_closed_shell_both_survive(self):
        p, t = tetrahedron()
        p = np.vstack((p, [[10, 0, 0], [11, 0, 0], [10, 1, 0]]))
        t = np.vstack((t, [4, 5, 6]))
        body_p, body_t = grid()
        p = np.vstack((p, body_p + [20, 0, 0]))
        t = np.vstack((t, body_t + 7))
        for preserve in (True,):
            with self.subTest(preserve_seams=preserve):
                result, _ = M.decimate(p.copy(), np.arange(len(p)), t,
                                       np.ones(len(t)), 0, lambda _: None,
                                       np.zeros(len(p), int), preserve)
                self.assertLess(len(result), len(t))
                self.assertEqual(sum(np.all(row < 4) for row in result), 4)
                self.assertGreaterEqual(sum(np.all(row >= 7) for row in result), 1)
                self.assertTrue(any(set(row) == {4, 5, 6} for row in result))
                faces = [tuple(sorted(row)) for row in result]
                self.assertEqual(len(set(faces)), len(faces))
                area = np.linalg.norm(np.cross(p[result[:, 1]] - p[result[:, 0]],
                                               p[result[:, 2]] - p[result[:, 0]]), axis=1)
                self.assertTrue(np.all(area > 0))

    def test_relaxed_seam_moves_geometry_without_merging_corner_attributes(self):
        points, faces = grid()
        # Every face has its own chart wedges; shared positions carry different UV,
        # material and bone labels. Retaining wedge identity retains all three.
        original = points[faces.ravel()].copy()
        positions, places = original.copy(), faces.ravel().copy()
        tris = np.arange(len(positions)).reshape(-1, 3)
        uv = np.arange(len(positions) * 2).reshape(-1, 2) / 100.0
        material = np.repeat(np.arange(len(tris)), 3)
        bone = np.tile([0, 1, 2], len(tris))
        labels = [(tuple(uv[w]), int(material[w]), int(bone[w]))
                  for w in range(len(positions))]
        saved_bones = bone.copy()
        result, _ = M.decimate(positions, places, tris, np.ones(len(tris)),
                               4, lambda _: None, bone, True)
        self.assertLess(len(result), len(tris))
        self.assertLessEqual(len(result), 4)
        original_faces = {tuple(row) for row in tris}
        for row in result:
            self.assertIn(tuple(row), original_faces)
            # A remap to a neighbour's chart changes one of these corner labels.
            source = tris[int(material[row[0]])]
            self.assertEqual([labels[w] for w in row], [labels[w] for w in source])
        np.testing.assert_array_equal(bone, saved_bones)
        moved = np.flatnonzero(np.any(positions != original, axis=1))
        self.assertTrue(len(np.intersect1d(moved, np.unique(result))) > 0,
                        'fixture must move a surviving seam wedge')
        for point in np.unique(places[np.unique(result)]):
            same_place = positions[np.unique(result)[places[np.unique(result)] == point]]
            np.testing.assert_allclose(same_place, np.broadcast_to(same_place[0], same_place.shape))
        self.assertTrue(edges(result, bone) <= edges(tris, saved_bones))

    def test_bone_guard_rejects_new_distant_bone_edges(self):
        p, tris = grid()
        bone = np.arange(len(p))
        original_edges = edges(tris, bone)
        # Show that this fixture can create the offending edges if unconstrained.
        unsafe, _ = M.decimate(p.copy(), np.arange(len(p)), tris,
                               np.ones(len(tris)), 4, lambda _: None)
        self.assertTrue(edges(unsafe, bone) - original_edges)
        safe, _ = M.decimate(p.copy(), np.arange(len(p)), tris,
                             np.ones(len(tris)), 4, lambda _: None, bone)
        self.assertLess(len(safe), len(tris))
        self.assertTrue(edges(safe, bone) <= original_edges)

    def test_planar_eye_surface_is_held_even_when_quadric_error_is_zero(self):
        points, tris = grid()
        positions, places = points.copy(), np.arange(len(points))
        result, weights = M.decimate(positions, places, tris,
                                     np.full(len(tris), M.EYE_WEIGHT), 4,
                                     lambda _: None, np.zeros(len(points), int), True)
        np.testing.assert_array_equal(result, tris)
        np.testing.assert_array_equal(positions, points)
        np.testing.assert_array_equal(places, np.arange(len(points)))
        np.testing.assert_array_equal(weights, np.full(len(tris), M.EYE_WEIGHT))

    def test_subtexel_uv_surface_keeps_one_sample_and_rim(self):
        tiny = np.zeros((64, 64), bool)
        tiny[63, 63] = True
        mask = M.shape_at(tiny, 1, 1)
        np.testing.assert_array_equal(mask, np.ones((3, 3), bool))
        # Already occupied shapes keep their ordinary resized sample plus rim.
        normal = M.shape_at(np.ones((8, 8), bool), 4, 3)
        np.testing.assert_array_equal(normal, np.ones((5, 6), bool))

    def test_impossible_budget_fails_before_any_asset_write(self):
        points, faces = tetrahedron()
        positions = points[faces.ravel()].copy()
        tris = np.arange(len(positions)).reshape(-1, 3)
        # Separate texture-chart corners also make the strict legacy mode unable
        # to reach one triangle; default-mode shell survival is not promised.
        # Mock the source reader only: real weld/decimate/convert/make enforce the
        # budget. No proprietary fixture, filesystem reads or asset writes needed.
        source = (positions, np.tile([0., 0., 1.], (len(positions), 1)),
                  np.zeros(len(positions), int),
                  np.arange(len(positions) * 2).reshape(-1, 2) / 100.0,
                  ['skin'] * len(positions), tris, np.ones(len(tris)), {}, 0)
        base = {'parts': 4, 'triangles': 1, 'width': 16, 'height': 16, 'rows': 1}
        for preserve in (False, True):
            with self.subTest(preserve_seams=preserve), \
                    patch.object(M, 'read_dm', return_value=base), \
                    patch.object(M.T, 'read_geom', return_value={'bones': []}), \
                    patch.object(M, 'source', return_value=source), \
                    patch.object(M, 'slot_anims', return_value=[]), \
                    patch.object(M, 'write') as write:
                with self.assertRaisesRegex(ValueError,
                                            r'cannot meet triangle budget: 4 remain, 1 allowed'):
                    M.make('synthetic.geom', 'unused-web', 5, 'unused-output', 404,
                           log=lambda _: None, preserve_seams=preserve)
                write.assert_not_called()


if __name__ == '__main__':
    unittest.main(verbosity=2)
