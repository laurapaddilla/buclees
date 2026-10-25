// Componentes de Buclees (React 18). Estilos: buclees.css + tokens.css
import React from 'react';
const R = React, h = React.createElement;

function cx() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }
function omit(o, keys) { var r = {}; for (var k in o) if (keys.indexOf(k) < 0) r[k] = o[k]; return r; }

var PATHS = {
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  reset: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v3.7h3.7',
  heart: 'M12 19.5s-7-4.3-7-9.6A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.3c0 5.3-7 9.6-7 9.6z',
  check: 'M5.5 12.5l4 4 9-9',
  bag: 'M6 8h12l-1 12H7L6 8zM9 8a3 3 0 0 1 6 0',
  hook: 'M15 3.5v11a3.5 3.5 0 0 1-7 0v-1.5M15 3.5a1.6 1.6 0 0 0-3 0'
};
function Icon(p) {
  var s = p.size || 20;
  return h('svg', { viewBox: '0 0 24 24', width: s, height: s, fill: p.filled ? 'currentColor' : 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true', className: 'bc-icon' }, h('path', { d: PATHS[p.name] }));
}

function Button(props) {
  var variant = props.variant || 'primary', size = props.size || 'md';
  var rest = omit(props, ['variant', 'size', 'icon', 'className', 'children']);
  return h('button', Object.assign({ type: 'button' }, rest, { className: cx('bc-btn', 'bc-btn--' + variant, 'bc-btn--' + size, props.className) }),
    props.icon ? h(Icon, { name: props.icon, size: size === 'sm' ? 16 : 18 }) : null,
    props.children);
}

function Badge(props) {
  return h('span', { className: cx('bc-badge', 'bc-badge--' + (props.tone || 'neutral'), props.className) }, props.children);
}

var LEVELS = { principiante: ['oliva', 'Principiante'], intermedio: ['amarillo', 'Intermedio'], avanzado: ['rosa', 'Avanzado'] };
function DifficultyBadge(level) { var l = LEVELS[level]; return l ? h(Badge, { tone: l[0] }, l[1]) : null; }

function Tag(props) {
  var st = R.useState(!!props.defaultSelected);
  var on = props.selected != null ? props.selected : st[0];
  function toggle() { var n = !on; if (props.selected == null) st[1](n); if (props.onChange) props.onChange(n); }
  return h('button', { type: 'button', className: cx('bc-tag', on && 'is-on', props.className), 'aria-pressed': on, onClick: toggle },
    on ? h(Icon, { name: 'check', size: 16 }) : null, props.children);
}

function Input(props) {
  var auto = R.useId ? R.useId() : 'bc-in';
  var id = props.id || auto, msgId = id + '-msg';
  var rest = omit(props, ['label', 'hint', 'error', 'id', 'className']);
  var msg = props.error || props.hint;
  return h('div', { className: cx('bc-field', props.error && 'is-error', props.className) },
    props.label ? h('label', { className: 'bc-field__label', htmlFor: id }, props.label) : null,
    h('input', Object.assign({}, rest, { id: id, className: 'bc-input', 'aria-invalid': props.error ? 'true' : undefined, 'aria-describedby': msg ? msgId : undefined })),
    msg ? h('p', { id: msgId, className: 'bc-field__msg' }, props.error ? 'Error: ' + props.error : props.hint) : null);
}

function RowCounter(props) {
  var st = R.useState(props.initial || 0), n = st[0];
  var target = props.target, label = props.label || 'Vuelta';
  function set(v) { v = Math.max(0, v); st[1](v); if (props.onChange) props.onChange(v); }
  var done = target && n >= target;
  var pct = target ? Math.min(100, Math.round(n / target * 100)) : 0;
  return h('section', { className: cx('bc-counter', done && 'is-done', props.className), 'aria-label': 'Contador de ' + label.toLowerCase() + 's' },
    h('div', { className: 'bc-counter__head' },
      h('span', { className: 'bc-counter__label' }, props.title || label + 's'),
      h('button', { type: 'button', className: 'bc-counter__reset', onClick: function () { set(0); }, 'aria-label': 'Reiniciar contador' }, h(Icon, { name: 'reset', size: 18 }), 'Reiniciar')),
    h('div', { className: 'bc-counter__body' },
      h('button', { type: 'button', className: 'bc-counter__btn', onClick: function () { set(n - 1); }, disabled: n === 0, 'aria-label': 'Restar una ' + label.toLowerCase() }, h(Icon, { name: 'minus', size: 28 })),
      h('div', { className: 'bc-counter__value', 'aria-live': 'polite' },
        h('span', { className: 'bc-counter__num' }, n),
        target ? h('span', { className: 'bc-counter__of' }, done ? '¡Objetivo alcanzado!' : 'de ' + target + ' ' + label.toLowerCase() + 's') : null),
      h('button', { type: 'button', className: 'bc-counter__btn bc-counter__btn--plus', onClick: function () { set(n + 1); }, 'aria-label': 'Sumar una ' + label.toLowerCase() }, h(Icon, { name: 'plus', size: 28 }))),
    target ? h('div', { className: 'bc-counter__bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': target, 'aria-valuenow': Math.min(n, target), 'aria-label': 'Progreso' },
      h('span', { style: { width: pct + '%' } })) : null);
}

function SaveButton(p) {
  var st = R.useState(!!p.saved), on = st[0];
  return h('button', { type: 'button', className: cx('bc-save', on && 'is-on'), 'aria-pressed': on, 'aria-label': on ? 'Quitar de guardados' : 'Guardar', onClick: function () { st[1](!on); } }, h(Icon, { name: 'heart', size: 20, filled: on }));
}

function PatternCard(props) {
  var media = props.image ? { backgroundImage: 'url(' + props.image + ')' } : null;
  var free = props.price == null || props.price === 0 || props.price === 'Gratis';
  return h('article', { className: cx('bc-card', 'bc-pattern', props.className) },
    h('div', { className: cx('bc-pattern__media', !props.image && 'is-placeholder'), style: media },
      h(SaveButton, { saved: props.saved })),
    h('div', { className: 'bc-card__body' },
      h('div', { className: 'bc-row' }, DifficultyBadge(props.difficulty), free ? h(Badge, { tone: 'oliva' }, 'Gratis') : null),
      h('h3', { className: 'bc-card__title' }, props.href ? h('a', { href: props.href }, props.title) : props.title),
      props.designer ? h('p', { className: 'bc-card__meta' }, 'por ' + props.designer) : null,
      h('p', { className: 'bc-card__specs' },
        props.hook ? h('span', null, h(Icon, { name: 'hook', size: 16 }), 'Ganchillo ' + props.hook) : null,
        props.yarn ? h('span', null, props.yarn) : null),
      !free ? h('p', { className: 'bc-card__price' }, typeof props.price === 'number' ? props.price.toFixed(2).replace('.', ',') + ' €' : props.price) : null));
}

function YarnCard(props) {
  var colors = props.colors || (props.color ? [props.color] : []);
  return h('article', { className: cx('bc-card', 'bc-yarn', props.className) },
    h('div', { className: 'bc-yarn__swatches', 'aria-hidden': 'true' },
      colors.slice(0, 5).map(function (c, i) { return h('span', { key: i, className: 'bc-yarn__ball', style: { background: c } }); })),
    h('div', { className: 'bc-card__body' },
      props.weight ? h(Badge, null, props.weight) : null,
      h('h3', { className: 'bc-card__title' }, props.name),
      props.fiber ? h('p', { className: 'bc-card__meta' }, props.fiber) : null,
      h('dl', { className: 'bc-yarn__specs' },
        props.meters ? h('div', null, h('dt', null, 'Metraje'), h('dd', null, props.meters)) : null,
        props.hook ? h('div', null, h('dt', null, 'Ganchillo'), h('dd', null, props.hook)) : null),
      h('div', { className: 'bc-yarn__foot' },
        props.price != null ? h('p', { className: 'bc-card__price' }, typeof props.price === 'number' ? props.price.toFixed(2).replace('.', ',') + ' €' : props.price) : null,
        h(Button, { size: 'sm', icon: 'bag', onClick: props.onAdd }, props.addLabel || 'Añadir'))));
}

function TutorialStep(props) {
  return h('div', { className: cx('bc-step', props.done && 'is-done', props.className) },
    h('span', { className: 'bc-step__num', 'aria-hidden': 'true' }, props.done ? h(Icon, { name: 'check', size: 20 }) : props.step),
    h('div', { className: 'bc-step__body' },
      h('h3', { className: 'bc-step__title' }, h('span', { className: 'bc-sr' }, 'Paso ' + props.step + (props.done ? ', completado' : '') + ': '), props.title),
      props.stitches && props.stitches.length ? h('ul', { className: 'bc-step__stitches', 'aria-label': 'Puntos' },
        props.stitches.map(function (s, i) { return h('li', { key: i }, s); })) : null,
      h('div', { className: 'bc-step__text' }, props.children)));
}


export { Button, Badge, Tag, Input, RowCounter, PatternCard, YarnCard, TutorialStep };
