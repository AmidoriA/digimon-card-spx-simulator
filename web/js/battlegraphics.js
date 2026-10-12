/* Shared, independent battle graphics controls for setup, matches and attack previews. */
(function () {
  'use strict';
  var B=window.DDCB_B3D, fields=[
    {key:'lighting',label:'Lighting',values:[['legacy','Original PS1'],['enhanced','Enhanced'],['ultra','Ultra · surface shadows']]},
    {key:'model',label:'Model shape',values:[['original','Original polygons'],['refined','Refined'],['smooth','Smooth']]},
    {key:'resolution',label:'Render resolution',values:[['auto','Adaptive · 960 × 720'],['ps1','320 × 240'],['medium','640 × 480'],['high','960 × 720'],['maximum','1280 × 960']]},
    {key:'arena',label:'Arena resolution',values:[['original','Original textures'],['2x','Sharper · 2×'],['4x','Sharper · 4×']]},
    {key:'effects',label:'Attack effects',values:[['legacy','Original PS1'],['enhanced','Enhanced'],['ultra','Ultra · more particles']]}
  ];
  var presets=Array.from(document.querySelectorAll('[data-battle-preset]')), controls=[];
  function sync() {
    var settings=B.getGraphics();
    controls.forEach(function(c){c.select.value=settings[c.key];});
    presets.forEach(function(select){select.value=B.getPreset();});
  }
  function save() {
    try {localStorage.setItem('ddcb-battle-style',B.style);localStorage.setItem('ddcb-battle-graphics',JSON.stringify(B.getGraphics()));} catch(err){/* storage unavailable */}
  }
  document.querySelectorAll('[data-battle-graphics]').forEach(function(panel){
    fields.forEach(function(field){
      var label=document.createElement('label'),select=document.createElement('select');
      label.className='optl';label.textContent=field.label;select.id=panel.dataset.battleGraphics+'-'+field.key;
      field.values.forEach(function(value){var option=document.createElement('option');option.value=value[0];option.textContent=value[1];select.appendChild(option);});
      label.appendChild(select);panel.appendChild(label);controls.push({key:field.key,select:select});
      select.onchange=function(){var value={};value[field.key]=this.value;B.setGraphics(value);sync();save();};
    });
  });
  var style='enhanced',settings=null;
  try {style=localStorage.getItem('ddcb-battle-style')||style;settings=JSON.parse(localStorage.getItem('ddcb-battle-graphics')||'null');} catch(err){/* use preset */}
  B.setStyle(style);if(settings)B.setGraphics(settings);sync();
  presets.forEach(function(select){
    select.onchange=function(){if(this.value==='custom')return;B.setStyle(this.value);sync();save();};
  });
})();
