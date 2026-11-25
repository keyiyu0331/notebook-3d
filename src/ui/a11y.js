// Visually hidden, semantic copy of all content (screen readers, search engines, Ctrl+F).
import * as C from '../content.js';

const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rich = s => esc(s)
  .replace(/==(.+?)==/g, '<mark>$1</mark>')
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
const fields = f => f.length ? '<dl>' + f.map(([dt, dd]) => `<dt>${esc(dt)}</dt><dd>${rich(dd)}</dd>`).join('') + '</dl>' : '';

export function buildA11y(root) {
  root.innerHTML = `
  <h1>${esc(C.profile.name)}</h1>
  <p>${esc(C.profile.label)}. ${esc(C.profile.tagline)}</p>
  <p>${esc(C.profile.abstract)}</p>
  <p>${C.profile.links.map(l => `<a href="${l.href}">${esc(l.label)}</a>`).join(' · ')}</p>
  <h2>Experience</h2>
  ${C.jobs.map(j => `<article><h3>${esc(j.org)}</h3><p>${esc(j.role)} · ${esc(j.when)} · ${esc(j.where)}</p>${fields(j.fields)}</article>`).join('')}
  <h3>Earlier positions</h3>
  <ul>${C.earlier.map(e => `<li>${esc(e.org)}, ${esc(e.role)} (${esc(e.when)})${e.text ? '. ' + esc(e.text) : ''}</li>`).join('')}</ul>
  <h2>Projects</h2>
  ${C.projects.map(p => `<article><h3>${esc(p.id)}: ${esc(p.title)}</h3><p>${esc(p.when)} · ${esc(p.where)}</p>${fields(p.fields)}</article>`).join('')}
  <h2>Publications</h2>
  <ol>${C.pubs.map(p => `<li>${p.href ? `<a href="${p.href}">${esc(p.title)}</a>` : esc(p.title)}. ${rich(p.venue)}</li>`).join('')}</ol>
  <h2>Materials &amp; methods</h2>
  ${C.materials.map(([h, it]) => `<h3>${esc(h)}</h3><ul>${it.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`).join('')}
  <h2>Training</h2>
  ${C.schools.map(s => `<h3>${esc(s.name)}</h3><p>${esc(s.deg)} · ${esc(s.when)}</p><p>${esc(s.cw)}</p>`).join('')}
  <h2>Correspondence</h2>
  <p>${esc(C.contact.text)} <a href="${C.EMAIL}">keyiyu@stanford.edu</a></p>`;
}
