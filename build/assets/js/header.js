var icon=document.querySelector('.header__mobile-icon');
var menu=document.querySelector('.header__mobile-content');
var btn=document.querySelector('.header__mobile-btn');

btn.addEventListener("click", function(){
	if (menu.style.display =='none'){
		menu.style.display = 'flex';
	}
	else{
		menu.style.display ='none';
	}
})
