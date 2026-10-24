'use strict';
(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const body = document.body;
  if (window.lucide) lucide.createIcons();
  const now = new Date();
  $('#current-date').textContent = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(now);
  $('#current-date').dateTime = now.toISOString();
  $('#footer-year').textContent = new Intl.DateTimeFormat('en', {year: 'numeric',timeZone:'Asia/Kolkata'}).format(now);
  const toggle = $('#sidebar-toggle');
  const sidebar = $('#sidebar');
  const isMobile = () => matchMedia('(max-width: 760px)').matches;
  const isTablet = () => matchMedia('(min-width: 761px) and (max-width: 1100px)').matches;
  function syncSidebar() {
    const expanded = isMobile() ? body.classList.contains('mobile-open') : isTablet() ? body.classList.contains('nav-expanded') : !body.classList.contains('collapsed');
    toggle.setAttribute('aria-expanded', String(expanded));
    sidebar.inert = isMobile() && !expanded;
  }
  function closeMobile() { body.classList.remove('mobile-open'); syncSidebar(); }
  toggle.addEventListener('click', () => {
    if (isMobile()) body.classList.toggle('mobile-open');
    else if (isTablet()) body.classList.toggle('nav-expanded');
    else body.classList.toggle('collapsed');
    syncSidebar();
    if (isMobile() && body.classList.contains('mobile-open')) sidebar.querySelector('a').focus();
  });
  $('.scrim').addEventListener('click', () => { closeMobile(); toggle.focus(); });
  window.addEventListener('resize', () => { if (!isMobile()) closeMobile(); syncSidebar(); });
  sidebar.addEventListener('keydown', e => {
    if (!isMobile() || !body.classList.contains('mobile-open') || e.key !== 'Tab') return;
    const nodes = [...sidebar.querySelectorAll('button,a[href]')];
    if (e.shiftKey && document.activeElement === nodes[0]) { e.preventDefault(); nodes.at(-1).focus(); }
    if (!e.shiftKey && document.activeElement === nodes.at(-1)) { e.preventDefault(); nodes[0].focus(); }
  });
  $('.nav-link.active').addEventListener('click', () => { closeMobile(); $('#main').scrollIntoView({behavior: 'smooth'}); });
  syncSidebar();
  let toastTimer;
  function toast(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 5500); }
  const preview = $('#preview-dialog');
  let dialogOpener;
  function openDialog(dialog, opener) { dialogOpener = opener || document.activeElement; closeMobile(); closeNotifications(); dialog.showModal(); body.classList.add('dialog-open'); }
  function closeDialog(dialog) { dialog.close(); }
  $$('dialog').forEach(dialog => {
    dialog.querySelectorAll('.dialog-close').forEach(button => button.addEventListener('click', () => closeDialog(dialog)));
    dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog(dialog); } });
    dialog.addEventListener('close', () => { body.classList.remove('dialog-open'); if (dialogOpener?.closest('#sidebar') && isMobile()) toggle.focus(); else dialogOpener?.focus(); });
  });
  $$('[data-preview]').forEach(button => button.addEventListener('click', () => { $('#preview-title').textContent = button.dataset.preview; openDialog(preview, button); }));
  $('#preview-done').addEventListener('click', () => closeDialog(preview));
  const notificationToggle = $('#notification-toggle'), notificationPanel = $('#notification-panel');
  function closeNotifications() { notificationPanel.hidden = true; notificationToggle.setAttribute('aria-expanded','false'); }
  notificationToggle.addEventListener('click', () => { notificationPanel.hidden = !notificationPanel.hidden; notificationToggle.setAttribute('aria-expanded',String(!notificationPanel.hidden)); });
  document.addEventListener('click', e => { if (!e.target.closest('.notification-wrap')) closeNotifications(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeNotifications(); if (body.classList.contains('mobile-open')) { closeMobile(); toggle.focus(); } } });
  $('#financial-year').addEventListener('change', e => toast(`${e.target.value} selected. Figures remain illustrative sample data.`));
  const periods = {
    today: {present:112,late:6,absent:6,leave:10,total:128,label:'128 employees · Today',comparison:'vs. previous day · sample comparison',unit:'employees'},
    week: {present:568,late:24,absent:28,leave:44,total:640,label:'640 scheduled employee-days · This week',comparison:'vs. previous week · sample comparison',unit:'employee-days'},
    month: {present:2420,late:88,absent:148,leave:248,total:2816,label:'2,816 scheduled employee-days · This month',comparison:'vs. previous month · sample comparison',unit:'employee-days'}
  };
  let chart;
  const colors = ['#10B981','#2563EB','#CBD5E1','#93B4ED'];
  if (window.Chart) {
    Chart.defaults.font.family = 'DM Sans, sans-serif';
    chart = new Chart($('#attendance-chart'), { type:'doughnut',data:{ labels:['Present on time','Late check-ins (present)','Absent','On leave'],datasets:[{data:[106,6,6,10],backgroundColor:colors,borderWidth:4,borderColor:'#fff',borderRadius:5,hoverOffset:3}]},options:{responsive:true,maintainAspectRatio:false,cutout:'78%',animation:matchMedia('(prefers-reduced-motion: reduce)').matches ? false : {duration:500},plugins:{legend:{display:false},tooltip:{backgroundColor:'#0F172A',padding:12,cornerRadius:7,displayColors:true,callbacks:{label:ctx => ` ${ctx.label}: ${ctx.parsed} ${periods[$('#attendance-period').value].unit}`}}}} });
  } else { $('.donut-wrap').classList.add('fallback'); $('#attendance-chart').hidden=true; }
  $('#attendance-period').addEventListener('change', e => {
    const d=periods[e.target.value];
    $('#present-count').textContent=d.present.toLocaleString('en-IN');
    $('#absent-count').textContent=String(d.absent).padStart(2,'0');
    $('#leave-count').textContent=String(d.leave).padStart(2,'0');
    $('#late-count').textContent=String(d.late).padStart(2,'0');
    $('#attendance-rate').innerHTML=`${(d.present/d.total*100).toFixed(1)}<span>%</span>`;
    $('#attendance-note').textContent=d.label;
    $('#attendance-comparison').textContent=d.comparison;
    $('.attendance-panel .panel-foot .positive').innerHTML=`<span aria-hidden="true">↗</span> ${e.target.value==='today'?'+3.2':e.target.value==='week'?'+2.1':'+1.8'} pts`;
    const values=[d.present-d.late,d.late,d.absent,d.leave];
    $('#attendance-chart').setAttribute('aria-label',`Sample attendance in ${d.unit}: ${values[0]} on time, ${d.late} late, ${d.absent} absent and ${d.leave} on leave. Late check-ins are included in present.`);
    if(chart){chart.data.datasets[0].data=values;chart.update();}
    else {const a=values[0]/d.total*100,b=d.present/d.total*100,c=(d.present+d.absent)/d.total*100;$('.donut-wrap').style.background=`conic-gradient(#10b981 0 ${a}%,#2563eb ${a}% ${b}%,#cbd5e1 ${b}% ${c}%,#93b4ed ${c}%)`;}
  });
  $('#certificate-search').addEventListener('input', e => {
    const query=e.target.value.trim().toLowerCase();let count=0;
    $$('#certificate-table tbody tr').forEach(row => {row.hidden=!row.textContent.toLowerCase().includes(query);if(!row.hidden)count++;});
    $('#certificate-empty').hidden=count!==0;
    $('#certificate-results').textContent=`${count} ${count===1?'record':'records'}`;
  });
  const sections=[['Overview','main'],['Attendance Overview','attendance'],['Employee & Team Overview','employees'],['Distributor Network','distributors'],['Certificate Management','certificates']];
  const searchDialog=$('#search-dialog');
  function renderSearch(){const q=$('#workspace-search').value.toLowerCase().trim(); const results=sections.filter(([name])=>name.toLowerCase().includes(q));$('#search-results').replaceChildren();results.forEach(([name,id])=>{const button=document.createElement('button');button.className='search-result';button.textContent=name+' ↗';button.addEventListener('click',()=>{searchDialog.close();const target=document.getElementById(id);target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});$('#search-results').append(button);});if(!results.length){const message=document.createElement('p');message.className='empty-state';message.textContent='No dashboard sections found.';$('#search-results').append(message);}}
  function openSearch(){ $('#workspace-search').value='';renderSearch();openDialog(searchDialog,$('#search-trigger'));$('#workspace-search').focus(); }
  $('#search-trigger').addEventListener('click',openSearch);
  $('#workspace-search').addEventListener('input',renderSearch);
  document.addEventListener('keydown', e => {if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(!document.querySelector('dialog[open]'))openSearch();}});
  $('#export-report').addEventListener('click', () => {
    const rows=[['BIOHALL ERP DESIGN PREVIEW - SAMPLE DATA ONLY'],['Financial year selection',$('#financial-year').value],['Metric','Sample value'],['Total employees',128],['Present today',112],['Pending leave requests',8],['Open tickets',14],['Active distributors',36],['Certificates issued',284],['Notice','Illustrative dashboard data. Not an operational or financial report.']];
    const csv=rows.map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='biohall-dashboard-SAMPLE-report.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Sample report downloaded. Contains demonstration data only.');
  });
})();
