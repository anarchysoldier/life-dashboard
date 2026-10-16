
/* v1.27.1: globalna zadana boja kartica i reset pojedinacne kartice */
document.addEventListener('click',function(e){
 const reset=e.target.closest('#cardResetColor');
 if(reset){e.preventDefault();const picker=document.querySelector('#cardColor');if(picker){picker.value=state.defaultCardColor;picker.dataset.useDefault='1';const hint=document.querySelector('#cardColorHint');if(hint)hint.textContent='Koristi zadanu boju iz Postavki';}return;}
 const save=e.target.closest('[data-save-default-card-color]');
 if(save){e.preventDefault();e.stopImmediatePropagation();const input=document.querySelector('#defaultCardColor');if(!input)return;state.defaultCardColor=input.value;persist();const y=window.scrollY;render();window.scrollTo(0,y);toast('Zadana boja gornjeg ruba spremljena. Kartice s vlastitom bojom ostaju nepromijenjene.');}
},true);
document.addEventListener('input',function(e){if(e.target.id==='cardColor'){e.target.dataset.useDefault='0';const hint=document.querySelector('#cardColorHint');if(hint)hint.textContent='Prilagođena boja';}});
