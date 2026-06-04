(function(){
  try{
    var s=localStorage.getItem('gymsync-theme');
    var p=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
    var t=s||p;
    document.documentElement.classList.remove('dark','light');
    document.documentElement.classList.add(t);
  }catch(e){}
})();
