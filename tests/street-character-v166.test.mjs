import test from 'node:test';
import assert from 'node:assert/strict';
import {characterWeights} from '../public/street-character-v166.js';
test('idle walk run weights stay normalized through movement transitions',()=>{for(const speed of [0,.1,1,2,3,4.3,8,-2]){const w=characterWeights(speed);assert.ok(Math.abs(w.idle+w.walk+w.run-1)<1e-8);for(const value of Object.values(w))assert.ok(value>=0&&value<=1)}assert.equal(characterWeights(0).idle,1);assert.equal(characterWeights(2).walk,1);assert.ok(Math.abs(characterWeights(4.3).run-1)<1e-8)});
