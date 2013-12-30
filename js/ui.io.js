MM.UI.IO = function() {
	this._prefix = "mm.app.";
	this._mode = "";
	this._node = document.querySelector("#io");
	this._heading = this._node.querySelector("h3");

	this._backend = this._node.querySelector("#backend");
	this._currentBackend = null;
	this._backends = {};
	var ids = ["local", "firebase", "gdrive", "file"];
	ids.forEach(function(id) {
		var ui = MM.UI.Backend.getById(id);
		ui.init(this._backend);
		this._backends[id] = ui;
	}, this);

	this._backend.value = localStorage.getItem(this._prefix + "backend") || MM.Backend.File.id;
	this._backend.addEventListener("change", this);
	
	MM.subscribe("map-new", this);
	MM.subscribe("save-done", this);
	MM.subscribe("load-done", this);
}

MM.UI.IO.prototype.handleMessage = function(message, publisher) {
	switch (message) {
		case "map-new":
			this._setCurrentBackend(null);
		break;
		
		case "save-done":
		case "load-done":
			this.hide();
			this._setCurrentBackend(publisher);
		break;
	}
}

MM.UI.IO.prototype.show = function(mode) {
	this._mode = mode;
	this._node.classList.add("visible");
	this._heading.innerHTML = mode;
	
	this._syncBackend();
	window.addEventListener("keydown", this);
}

MM.UI.IO.prototype.hide = function() {
	this._node.classList.remove("visible");
	document.activeElement.blur();
	window.removeEventListener("keydown", this);
}

MM.UI.IO.prototype.quickSave = function() {
	if (this._currentBackend) { 
		this._currentBackend.save();
	} else {
		this.show("save");
	}
}

MM.UI.IO.prototype.handleEvent = function(e) {
	switch (e.type) {
		case "keydown":
			if (e.keyCode == 27) { this.hide(); }
		break;
		
		case "change":
			this._syncBackend();
		break;
	}
}

MM.UI.IO.prototype._syncBackend = function() {
	var all = this._node.querySelectorAll("div[id]");
	[].concat.apply([], all).forEach(function(node) { node.style.display = "none"; });
	
	this._node.querySelector("#" + this._backend.value).style.display = "";
	
	this._backends[this._backend.value].show(this._mode);
}

MM.UI.IO.prototype._setCurrentBackend = function(backend) {
	if (this._currentBackend) { this._currentBackend.reset(); }
	
	if (backend) { localStorage.setItem(this._prefix + "backend", backend.id); }
	this._currentBackend = backend;
	this._updateURL();
}

MM.UI.IO.prototype._updateURL = function() {
	var data = this._currentBackend && this._currentBackend.getState();
	if (!data) {
		history.replaceState(null, "", ".");
	} else {
		data.id = MM.App.map.getId();
		var arr = Object.keys(data).map(function(key) {
			return encodeURIComponent(key)+"="+encodeURIComponent(data[key]);
		});
		history.replaceState(null, "", "?" + arr.join("&"));
	}
}
