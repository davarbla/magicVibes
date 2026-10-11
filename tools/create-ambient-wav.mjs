import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const output = resolve('apps/pocketbase/.local-windows/magical-garden.wav');
const sampleRate = 22050;
const duration = 24;
const samples = sampleRate * duration;
const notes = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 349.23];
const data = Buffer.alloc(samples * 2);

for (let i = 0; i < samples; i += 1) {
  const time = i / sampleRate;
  const note = notes[Math.floor(time / 3) % notes.length];
  const envelope = Math.min(1, time * 2, (duration - time) * 2);
  const pad = Math.sin(2 * Math.PI * note * time) * 0.22;
  const harmonic = Math.sin(2 * Math.PI * note * 2 * time) * 0.06;
  const shimmer = Math.sin(2 * Math.PI * note * 4 * time) * 0.025;
  const value = Math.max(-1, Math.min(1, (pad + harmonic + shimmer) * envelope));
  data.writeInt16LE(Math.round(value * 32767), i * 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, Buffer.concat([header, data]));
console.log(output);
