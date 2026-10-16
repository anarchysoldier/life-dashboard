(function(){
 'use strict';
 const areas=['nav','bottomnav','content','overlay','addMenu','pageTitle','v125Shade'];
 const targets=new Set(areas);
 const safeRoot=node=>{
   if(!node)return false;
   if(node.nodeType===3)node=node.parentElement;
   if(!node || !node.closest)return false;
   return areas.some(id=>node.id===id || !!node.closest('#'+id));
 };
 function replaceText(node){
   if(node.nodeType!==3 || !node.nodeValue || !node.nodeValue.includes('Chores'))return;
   if(!safeRoot(node))return;
   if(node.parentElement && node.parentElement.closest('script,style,textarea,[contenteditable="true"]'))return;
   node.nodeValue=node.nodeValue.replace(/\bChores\b/g,'Kućni poslovi');
 }
 function scan(root){
   if(!root)return;
   if(root.nodeType===3){replaceText(root);return;}
   if(root.nodeType!==1)return;
   if(root.matches('script,style,textarea,[contenteditable="true"]'))return;
   if(!safeRoot(root) && !targets.has(root.id))return;
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
   while(walker.nextNode())replaceText(walker.currentNode);
 }
 function apply(){areas.forEach(id=>scan(document.getElementById(id)));}
 apply();
 const observer=new MutationObserver(records=>{
   for(const record of records){
     if(record.type==='characterData')replaceText(record.target);
     if(record.type==='childList')record.addedNodes.forEach(scan);
   }
 });
 observer.observe(document.body,{subtree:true,childList:true,characterData:true});
})();