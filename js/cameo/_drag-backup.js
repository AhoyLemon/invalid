dragula([
	document.getElementById('left'),
	document.getElementById('TopValue'),
	document.getElementById('MiddleValue'),
	document.getElementById('BottomValue')
], {
	revertOnSpill: true,
	accepts: function (el, target, source, sibling) {
		/*
		if (target.classList.contains('drop-one') && target.childNodes.length > 1) {
			return false;
		} else {
			return true;
		}
		*/
		return true;
  },
})

.on('drag', function(el) {
	
	// add 'is-moving' class to element being dragged
  el.classList.add('is-moving');
  console.log('dragging!');
})
.on('dragend', function(el) {
	
	// remove 'is-moving' class from element after dragging has stopped
	el.classList.remove('is-moving');
	
	// add the 'is-moved' class for 600ms then remove it
	window.setTimeout(function() {
		el.classList.add('is-moved');
		window.setTimeout(function() {
			el.classList.remove('is-moved');
		}, 600);
	}, 100);
})
.on('drop', function (el, target) {
  //alert(target.getAttribute('drop-value'));
})



;