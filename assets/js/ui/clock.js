
(function(){
const dateEl=document.getElementById('headerClockDate');
const timeEl=document.getElementById('headerClockTime');
if(!dateEl||!timeEl)return;
const dateFmt=new Intl.DateTimeFormat('hr-HR',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
const timeFmt=new Intl.DateTimeFormat('hr-HR',{hour:'2-digit',minute:'2-digit',hour12:false});
function updateClock(){const now=new Date();dateEl.textContent=dateFmt.format(now);timeEl.textContent=timeFmt.format(now);}
updateClock();setInterval(updateClock,1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateClock()});
})();
