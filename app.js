function showMessage(text){const t=document.getElementById('toast');t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3500)}
