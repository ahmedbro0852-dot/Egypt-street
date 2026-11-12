// Egypt Streets V152 course-map geometry and mobile regression checks.
// Run: node --experimental-default-type=module --test tests/race-preview-v152.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {raceRouteLengthV152,raceRouteStatsV152,raceRouteSvgV152}
 from '../public/race-preview-v152.js';
import {CAIRO_RACES_V31} from '../public/cairo-races-v31.js';
const courses=CAIRO_RACES_V31.filter(c=>c.world);
test('all six Cairo city courses have precise positive route lengths',()=>{
 assert.equal(courses.length,6);
 for(const course of courses){
  const s=raceRouteStatsV152(course);
  assert.ok(s.lap>=120,course.id+' route unexpectedly short');
  assert.equal(s.total,s.lap*course.laps,course.id+' total mismatch');
  assert.equal(s.checkpointCount,course.points.length);
  const polyline=raceRouteSvgV152(course.points,course.color);
  assert.match(polyline,/class="v152CourseMap"/);
  assert.match(polyline,/viewBox="0 0 180 88"/);
  assert.match(polyline,/polyline points="/);
  assert.match(polyline,/<circle/);
  assert.ok(!polyline.includes('NaN')&&!polyline.includes('Infinity'));
 }
 assert.equal(raceRouteLengthV152([[0,0],[0,30],[30,30],[30,0]]),120);
});
test('world route preview fits a mobile panel and does not create extra WebGL',()=>{
 for(const course of courses){
  const html=raceRouteSvgV152(course.points,course.color);
  const pts=[...html.matchAll(/(?:cx|cy|x1|x2|y1|y2)="([0-9.]+)"/g)];
  assert.ok(pts.length>=8);
  for(const m of pts)assert.ok(Number(m[1])>=0&&Number(m[1])<=180);
  assert.ok(html.length<2400,'SVG should remain lightweight');
  assert.ok(!/script|foreignObject|href=/.test(html));
 }
});
test('malformed or user-controlled path coordinates never enter SVG output',()=>{
 assert.equal(raceRouteSvgV152([[0,0],[1,0],[Infinity,1]]),'');
 assert.equal(raceRouteSvgV152([[0,0],[1,0],['<script>',1]]),'');
 assert.equal(raceRouteSvgV152([[0,0],[1,0],[1e6,2]]),'');
 assert.equal(raceRouteLengthV152([[0,0],[NaN,30],[10,30]]),0);
 assert.equal(raceRouteLengthV152([]),0);
 assert.equal(raceRouteSvgV152([],123),'');
});
test('world-race cards display route, difficulty, laps, rivals, meters',()=>{
 const source=readFileSync(new URL('../public/cairo-races-v31.js',import.meta.url),'utf8');
 for(const token of ['v152CoursePreview','raceRouteStatsV152(course)',
   'raceRouteSvgV152(course.points,course.color)','v152Difficulty',
   'نقاط مرور','3 منافسين'])assert.ok(source.includes(token),token);
 const css=readFileSync(new URL('../public/race-league-v100.css',import.meta.url),'utf8');
 assert.match(css,/v152CourseMap/);
 assert.match(css,/@media\(max-width:480px\)/);
});
test('mobile 3D race pins use a bounded update interval',()=>{
 const race=readFileSync(new URL('../public/cairo-races-v31.js',import.meta.url),'utf8');
 assert.match(race,/lastBeaconAtV152>=140/);
 assert.match(race,/mobileLite\?95:125/);
});
