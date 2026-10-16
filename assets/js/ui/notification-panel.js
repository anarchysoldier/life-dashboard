
document.addEventListener('click',function(e){if(e.target.closest('#v127Panel,#notif'))return;document.getElementById('v127Panel')?.remove()},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape')document.getElementById('v127Panel')?.remove()});
window.addEventListener('resize',()=>document.getElementById('v127Panel')?.remove());
