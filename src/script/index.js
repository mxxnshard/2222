const svg = {
	cache: {},
	_insert: function (img, code) {
		const parent = img.parentNode;
		if (parent) {
			parent.insertAdjacentHTML("afterbegin", code);
			const svg = parent.querySelector("svg");
			if (svg) {
				svg.classList = img.classList;
				svg.id = img.id;
				svg.setAttribute("role", "img");
				const title = img.alt || img.getAttribute("aria-label") || null;
				svg.setAttribute("aria-label", title || "false");
			}
			parent.removeChild(img);
		}
	},
	load: function (container = document) {
		[].forEach.call(
			document.querySelectorAll("img[src*='.svg']"),
			(img) => {
				if (
					!img.dataset ||
					typeof img.dataset.original === "undefined"
				) {
					const data = img.parentNode.querySelector("svg");
					if (data) {
						data.parentNode.removeChild(data);
					}
					const src = img.src;
					if (typeof this.cache[src] !== "undefined") {
						svg._insert(img, svg.cache[src]);
					} else {
						fetch(src, {
							cache: "no-cache",
						})
							.then((response) => {
								if (response.ok) {
									return response.text();
								}
							})
							.then((text) => {
								if (typeof text !== "undefined") {
									svg._insert(img, text);
									svg.cache[src] = text;
								}
							});
					}
				}
			}
		);
	},
};

const form = {
	init: function(container = document){
		this.datepicker(container);
		this.file(container);
		this.dragndrop(container);
	},
	datepicker: function(container = document){
		if (typeof SimplePicker !== undefined){
			[].forEach.call(
				container.querySelectorAll("input[type='date']"),
				function(date){
					date.type = "text";
					date.setAttribute("readonly", true);
					const datePicker = new SimplePicker();
					datePicker.disableTimeSection();	
					datePicker.on("submit", function(dateObject){
						let day = dateObject.getDate();
						if (day < 10){
							day = "0" + day;
						}
						let month = dateObject.getMonth() + 1;
						if (month < 10){
							month = "0" + month;
						}
						let year = dateObject.getFullYear();
						date.value = `${day}.${month}.${year}`;	
					});
					date.addEventListener("focus", function(e){
						datePicker.open();
					});
					
				}
			);
		}
	},
	file: function(container = document){
		[].forEach.call(
			container.querySelectorAll("input[type='file']"),
			function(input){
				input.addEventListener("change", function(e){
					const target = e.target;
					if (!input.multiple){
						const file = target.files[0] || null;
						if (file){
							let reader = new FileReader();
							reader.onload = function(readerEvent){
								let placeholder = input.parentNode.querySelector("img");
								if (placeholder){
									placeholder.src = readerEvent.target.result;
								}
							};
							reader.readAsDataURL(file);
						}
					}else{
						const place = document.querySelector("#place");
						[].forEach.call(
							target.files,
							function(file){
								let reader = new FileReader();
								reader.onload = function(readerEvent){
									const wrap = document.createElement("span");
									wrap.classList.add("gallery__item");
									const image = document.createElement("img");
									image.src = readerEvent.target.result;
									wrap.appendChild(image);
									place.appendChild(wrap);
									
								};
								reader.readAsDataURL(file);
							}
						);
					}
				});	
			}
		);
	},
	dragndrop: function(container = document){
		[].forEach.call(
			container.querySelectorAll("[data-plugin='dragndrop']"),
			function(dropArea){
				['dragenter', 'dragover', 'dragleave', 'drop'].forEach(
					function(eventName){
						dropArea.addEventListener(eventName, function(e){
							e.preventDefault();
							e.stopPropagation();
						}, false);
					}
				);

				const highlight = function(e) {
					dropArea.classList.add('dragzone__items--over')
				};

				const unhighlight = function(e) {
					dropArea.classList.remove('dragzone__items--over')
				};

				const handleDrop = function(e) {
					let dt = e.dataTransfer;
					let files = dt.files;
					console.log(files);

					handleFiles(files);
				};

				const handleFiles = function(files){
					[].forEach.call(files, function(file){
						const item = document.createElement("div");
						item.classList.add("dragzone__item");
						if (/^image\/.*/i.test(file.type)){
							item.classList.add("dragzone__item--picture");
							const icon = document.createElement("img");
							icon.classList.add("dragzone__image");
							item.appendChild(icon);
							let reader = new FileReader();
							reader.onload = function(readerEvent){
								icon.src = readerEvent.target.result;
							};
							reader.readAsDataURL(file);
						}else{
							let fileFype = "blank";
							let match = file.name.match(/.*\.(.{3,4})$/i);
							if (match){
								fileFype = match[1];
							}
							item.classList.add("dragzone__item--icon");
							const file_c = document.createElement("div");
							file_c.classList.add("dragzone__icon");
							file_c.classList.add("fi");
							file_c.classList.add("fi-" + fileFype);
							const file_cc = document.createElement("div");
							file_cc.classList.add('fi-content');
							file_cc.innerHTML = fileFype;
							file_c.append(file_cc);
							item.appendChild(file_c);
						}
						dropArea.appendChild(item);
					});
				};

				['dragenter', 'dragover'].forEach(function(eventName){
					dropArea.addEventListener(eventName, highlight, false)
				});
				['dragleave', 'drop'].forEach(function(eventName){
					dropArea.addEventListener(eventName, unhighlight, false)
				});

				dropArea.addEventListener('drop', handleDrop, false)
			}
		);
	}
};

const createChat = () => {
	const ws = {
		connection: new WebSocket("ws://localhost:5777/"),
		callbacks: {},
		subscribe: function(action, callback){
			if (typeof callback == "function"){
				if (!this.callbacks[action]){
					this.callbacks[action] = [];
				}
				this.callbacks[action].push(callback);
			}
		},
		init: function(){
			const _this = this;
			_this.connection.onopen = function() {
				/*
				field.addEventListener("keydown", function(event) {
			   if (event.which == 13 && field.value.trim() != "") {
				   ws.send(field.value);
				   field.value = "";
			   }
		   });
		   */
			}
			_this.connection.onmessage = function(message) {
				const clbs = _this.callbacks.onmessage || [];
				clbs.forEach(function(callback){
					callback(JSON.parse(message.data));
				});
			}
			return _this;
		},
		sendMessage: function(message){
			this.connection.send(message);
		}
	};
	return ws.init();
};

document.addEventListener("DOMContentLoaded", function(e){
	svg.load();
	form.init();
});
