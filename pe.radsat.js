function tile2long(x,z) { 
	return (x/Math.pow(2,z)*360-180); 
}

function tile2lat(y,z) {
    var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
    return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
}

L.GridLayer.SateliteWU = L.GridLayer.extend({

	_loadedTiles: new Array(),

	onAdd: function(map) {
        L.GridLayer.prototype.onAdd.call(this, map);
        this.on("tileunload", function(d) {
			delete this._loadedTiles[d.tile.dataset.coords];
			d.tile = null;
        });
    },
	
	urlActual: function(coords) {
		var tile = this.url + "&frame=" + Math.floor(PE.RadSat.animacion.frameActual / 2);
		var maxlat = tile2lat(parseInt(coords.split('/')[2]), parseInt(coords.split('/')[0]));
		var minlon = tile2long(parseInt(coords.split('/')[1]), parseInt(coords.split('/')[0]));
		var minlat = tile2lat(parseInt(coords.split('/')[2]) + 1, parseInt(coords.split('/')[0]));
		var maxlon = tile2long(parseInt(coords.split('/')[1]) + 1, parseInt(coords.split('/')[0]));
		tile += "&maxlat=" + maxlat + "&maxlon=" + maxlon + "&minlat=" + minlat + "&minlon=" + minlon;
		return tile;
	}, 
	
	_cargarImagen: function(img, tile, frame) {
		return function(){
			if (!PE.RadSat.animacion.esFuturo()) {
				tile.style.backgroundImage = "url(" + img.src + ")";
				tile.dataset.frames += "," + frame;
			}
			img.onload = null;
			img = null;
		};
	},
	
	_errorImagen: function(img) {
		return function(){
			img.onload = null;
			img = null;
		};
	},
	
	createTile: function(coords, done) {
        var tile = document.createElement('div');
		var coord = coords.z + "/" + coords.x + "/" + coords.y;
		tile.dataset.coords = coord;
		tile.dataset.frames = "";
		if (PE.RadSat.opciones.transicionesSuaves)
			tile.style.transition = "background-image .2s ease-in-out";
		tile.style.visibility = "visible";
		if (!PE.RadSat.animacion.esFuturo()) {
			var img = document.createElement('img');
			img.src = this.urlActual(coord);
			img.onload = this._cargarImagen(img, tile, PE.RadSat.animacion.frameActual);
			img.onerror = this._errorImagen(img);
		}
		if ((PE.RadSat.opciones.modoMovil) && (PE.RadSat.opciones.integrarEtiquetas)) tile.style.opacity = "0.8";
		else tile.style.opacity = PE.RadSat.opciones.capasOpacidad;
		this._loadedTiles[coord] = tile;		
        return tile;
    },
	
	_dibujarFrame: function() {
		for (var coords in this._loadedTiles) {
			var tile = this._loadedTiles[coords];
			if (PE.RadSat.animacion.esFuturo()) 
				tile.style.backgroundImage = '';
			else {
				if (!tile.dataset) return;
				var frames = tile.dataset.frames.split(",");
				if (jQuery.inArray(PE.RadSat.animacion.frameActual.toString(), frames) == -1) {
					var img = document.createElement('img');
					img.src = this.urlActual(coords);
					img.onload = this._cargarImagen(img, tile, PE.RadSat.animacion.frameActual);
					img.onerror = this._errorImagen(img);
				} else tile.style.backgroundImage = "url(" + this.urlActual(coords) + ")";
				if ((PE.RadSat.opciones.modoMovil) && (PE.RadSat.opciones.integrarEtiquetas)) tile.style.opacity = "0.8";
				else tile.style.opacity = PE.RadSat.opciones.capasOpacidad;
			}
		}
	}

});

L.GridLayer.WeatherAPI = L.GridLayer.extend({

	tipo: "",
	tipoFuturo: "",
	factorFuturo: 5,
	offsetFuturo: 0,
	realEarth: false,

	onAdd: function(map) {
        L.GridLayer.prototype.onAdd.call(this, map);
        this.on("tileunload", function(d) {
			if (this._loadedTiles != null) delete this._loadedTiles[d.tile.dataset.coords];
			d.tile = null;
        });
    },
	
	urlActual: function(coords) {
		if (PE.RadSat.mapa._datosWeatherAPI != null) {
			if (PE.RadSat.animacion.esFuturo()) {
				if (PE.RadSat.mapa._datosWeatherAPI.seriesInfo[this.tipoFuturo].series[1].fts[
					PE.RadSat.mapa._datosWeatherAPI.seriesInfo[this.tipoFuturo].series[1].fts.length-1+
					this.offsetFuturo+(PE.RadSat.animacion.frameActual+1)*this.factorFuturo] == null)
					return "//www.pronosticoextendido.net/api/datos/tiles/blank.png";
				return "https://api2.weather.com/v3/TileServer/tile?product=" + this.tipoFuturo + "&ts=" + 
					PE.RadSat.mapa._datosWeatherAPI.seriesInfo[this.tipoFuturo].series[1].ts +
					"&fts=" + PE.RadSat.mapa._datosWeatherAPI.seriesInfo[this.tipoFuturo].series[1].fts[
					PE.RadSat.mapa._datosWeatherAPI.seriesInfo[this.tipoFuturo].series[1].fts.length-1+
					this.offsetFuturo+(PE.RadSat.animacion.frameActual+1)*this.factorFuturo] + 
					"&xyz=" + coords + "&apiKey=" + PE.RadSat.mapa._weatherAPIKey;
			}
			if (this.realEarth)
			{
				if ((PE.RadSat.mapa._datosRealEarth == null) || 
					(PE.RadSat.mapa._datosRealEarth[0].times[PE.RadSat.mapa._datosRealEarth[0].times.length-1-PE.RadSat.animacion.frameActual] == null))
					return "//www.pronosticoextendido.net/api/datos/tiles/blank.png";
				return "https://realearth.ssec.wisc.edu/api/image?products=G16-ABI-FD-TC_" + 
				PE.RadSat.mapa._datosRealEarth[0].times[PE.RadSat.mapa._datosRealEarth[0].times.length-1-PE.RadSat.animacion.frameActual].replace(".", "_") +
				"&x=" + coords.split(":")[0] + "&y=" + coords.split(":")[1]  + "&z="  + coords.split(":")[2]; 
			}
			if (PE.RadSat.mapa._datosWeatherAPI.seriesInfo[this.tipo].series[PE.RadSat.animacion.frameActual] == null)
				return "//www.pronosticoextendido.net/api/datos/tiles/blank.png";
			return "https://api2.weather.com/v3/TileServer/tile?product=" + this.tipo + "&ts=" +
					PE.RadSat.mapa._datosWeatherAPI.seriesInfo[this.tipo].series[PE.RadSat.animacion.frameActual].ts + 
					"&xyz=" + coords + "&apiKey=" + PE.RadSat.mapa._weatherAPIKey;
		}
		return "//www.pronosticoextendido.net/api/datos/tiles/blank.png";
	}, 
	
	_cargarImagen: function(img, tile, frame) {
		return function(){
			tile.style.backgroundImage = "url(" + img.src + ")";
			tile.style.backgroundSize = '256px';
			if ((PE.RadSat.opciones.modoMovil) && (PE.RadSat.opciones.integrarEtiquetas)) tile.style.opacity = "0.8";
			else tile.style.opacity = PE.RadSat.opciones.capasOpacidad;
			img.onload = null;
			img = null;
		};
	},
	
	_errorImagen: function(img) {
		return function(){
			img.onload = null;
			img = null;
		};
	},
	
	createTile: function(coords, done) {
        var tile = document.createElement('div');
		var coord = coords.x + ":" + coords.y + ":" + coords.z;
		tile.dataset.coords = coord;
		tile.dataset.frames = "";
		if (PE.RadSat.opciones.transicionesSuaves)
			tile.style.transition = "background-image .2s ease-in-out";
		tile.style.visibility = "visible";
		var img = document.createElement('img');
		img.src = this.urlActual(coord);
		img.onload = this._cargarImagen(img, tile, PE.RadSat.animacion.frameActual);
		img.onerror = this._errorImagen(img);
		if (tile.dataset.frames != "") tile.dataset.frames += ",";
		tile.dataset.frames += PE.RadSat.animacion.frameActual;
		if (this._loadedTiles == null) 
			this._loadedTiles = new Array();
		this._loadedTiles[coord] = tile;		
        return tile;
    },
	
	_dibujarFrame: function() {
		if (this._loadedTiles == null) return;
		for (var coords in this._loadedTiles) {
			var tile = this._loadedTiles[coords];
			if (!tile.dataset) return;
			var frames = tile.dataset.frames.split(",");
			if (jQuery.inArray(PE.RadSat.animacion.frameActual.toString(), frames) == -1) {
				var img = document.createElement('img');
				img.src = this.urlActual(coords);
				img.onload = this._cargarImagen(img, tile, PE.RadSat.animacion.frameActual);
				img.onerror = this._errorImagen(img);
				if (tile.dataset.frames != "") tile.dataset.frames += ",";
				tile.dataset.frames += PE.RadSat.animacion.frameActual;
			} else tile.style.backgroundImage = "url(" + this.urlActual(coords) + ")";
		}
	}

});

L.GridLayer.RadarMosaico = L.GridLayer.extend({

	_loadedTiles: new Array(),
	_coords: new Array(),

	onAdd: function(map) {
        L.GridLayer.prototype.onAdd.call(this, map);
        this.on("tileunload", function(d) {
			delete this._loadedTiles[d.tile.dataset.id];
			delete this._coords[d.tile.dataset.id];
			d.tile = null;
        });
    },
	
	urlActual: function(coords, fueraDeLimites) {
		if (fueraDeLimites) {
			if (PE.RadSat.mapa._datosWeatherAPI == null) 
				return "//www.pronosticoextendido.net/api/datos/tiles/blank.png";
			var xyz = coords.split('/');
			if (PE.RadSat.animacion.esFuturo())
				return "https://api2.weather.com/v3/TileServer/tile?product=radarFcst&ts=" + PE.RadSat.mapa._datosWeatherAPI.seriesInfo.radarFcst.series[1].ts +
					"&fts=" + PE.RadSat.mapa._datosWeatherAPI.seriesInfo.radarFcst.series[1].fts[
					PE.RadSat.mapa._datosWeatherAPI.seriesInfo.radarFcst.series[1].fts.length-1+(PE.RadSat.animacion.frameActual+1)*5] + 
					"&xyz=" + xyz[1] + ":" + xyz[2] + ":" + xyz[0] + "&apiKey=" + PE.RadSat.mapa._weatherAPIKey;
			return "https://api2.weather.com/v3/TileServer/tile?product=twcRadarMosaic&ts=" +
					PE.RadSat.mapa._datosWeatherAPI.seriesInfo.radar.series[PE.RadSat.animacion.frameActual].ts + 
					"&xyz=" + xyz[1] + ":" + xyz[2] + ":" + xyz[0] + "&apiKey=" + PE.RadSat.mapa._weatherAPIKey;
		}
		if (PE.RadSat.animacion.esFuturo()) {
			var d = new Date(PE.RadSat._fechaServidor.getTime());
			//var d = new Date(); d = new Date(d.getTime()+d.getTimezoneOffset()*60*1000); d = new Date(d.getTime()-3*60*60*1000); // Mover a Argentina
			d.setTime(d.getTime() - (PE.RadSat.animacion.frameActual *60*60*1000))
			var month = d.getMonth() + 1;
			var day = d.getDate();
			var year = d.getFullYear();
			var hr = d.getHours();
			if (day < 10) day = "0" + day.toString(); else day = day.toString();
			if (month < 10) month = "0" + month.toString(); else month = hr.toString();
			if (hr < 10) hr = "0" + hr.toString(); else hr = hr.toString();
			return PE.RadSat.radares._urlBase + "futuro/" + day + month + year + "-" + hr + "00/" + coords + ".png?r=" + PE.RadSat._random;
		} else {
			var d = new Date(PE.RadSat._fechaServidor.getTime());
			//var d = new Date(); d = new Date(d.getTime()+d.getTimezoneOffset()*60*1000); d = new Date(d.getTime()-3*60*60*1000); // Mover a Argentina
			d = new Date(d.getTime() - 60000 * PE.RadSat.animacion.frameActual * 10);
			var hr = d.getHours();
			var min = Math.round(d.getMinutes() / 10) * 10 - 10;
			if (min < 0) {
				min = 50;
				hr = hr - 1;
				if (hr < 0) hr = 23;
			}
			if (hr < 10) hr = "0" + hr.toString(); else hr = hr.toString();
			if (min < 10) min = "0" + min.toString(); else min = min.toString();
			return PE.RadSat.radares._urlBase + PE.RadSat.radares._rutaBase + "/mosaico/" + hr + min + "/" + coords + ".png?r=" + PE.RadSat._random;
		}
	}, 
	
	_cargarImagen: function(img, tile, frame) {
		return function(){
			tile.style.backgroundImage = 'url(' + img.src + ')';
			tile.style.backgroundSize = '256px';
			if ((PE.RadSat.opciones.modoMovil) && (PE.RadSat.opciones.integrarEtiquetas)) tile.style.opacity = "0.8";
			else tile.style.opacity = PE.RadSat.opciones.capasOpacidad;
			img.onload = null;
			img = null;
		};
	},
	
	_errorImagen: function(img) {
		return function(){
			img.onload = null;
			img = null;
		};
	},
	
	fueraDeLimites: function(coords) {
		if (PE.RadSat.animacion.esFuturo()) {
			fueraDeLimites = false;
			if ((coords.z == 9) && ((coords.x < 148) || (coords.x > 183))) fueraDeLimites = true;
			if ((coords.z == 8) && ((coords.x < 74) || (coords.x > 91))) fueraDeLimites = true;
			if ((coords.z == 7) && ((coords.x < 37) || (coords.x > 45))) fueraDeLimites = true;
			if ((coords.z == 6) && ((coords.x < 18) || (coords.x > 22))) fueraDeLimites = true;
			if ((coords.z == 5) && ((coords.x < 9) || (coords.x > 11))) fueraDeLimites = true;
			if ((coords.z == 4) && ((coords.x < 4) || (coords.x > 5))) fueraDeLimites = true;
			if ((coords.z == 3) && ((coords.x < 2) || (coords.x > 2))) fueraDeLimites = true;
			if ((coords.z == 2) && ((coords.x < 1) || (coords.x > 1))) fueraDeLimites = true;
			if ((coords.z == 9) && ((coords.y < 273) || (coords.y > 347))) fueraDeLimites = true;
			if ((coords.z == 8) && ((coords.y < 136) || (coords.y > 173))) fueraDeLimites = true;
			if ((coords.z == 7) && ((coords.y < 68) || (coords.y > 86))) fueraDeLimites = true;
			if ((coords.z == 6) && ((coords.y < 34) || (coords.y > 43))) fueraDeLimites = true;
			if ((coords.z == 5) && ((coords.y < 17) || (coords.y > 21))) fueraDeLimites = true;
			if ((coords.z == 4) && ((coords.y < 8) || (coords.y > 10))) fueraDeLimites = true;
			if ((coords.z == 3) && ((coords.y < 4) || (coords.y > 5))) fueraDeLimites = true;
			if ((coords.z == 2) && ((coords.y < 2) || (coords.y > 2))) fueraDeLimites = true;
			return fueraDeLimites;
		}
		if (!coords.scaleBy) return;
		var nwPoint = coords.scaleBy(this.getTileSize());
		var nw = PE.RadSat.mapa._mapa.unproject(nwPoint, coords.z);
		coords.x = coords.x + 1;
		coords.y = coords.y + 1;
		var sePoint = coords.scaleBy(this.getTileSize());
		var se = PE.RadSat.mapa._mapa.unproject(sePoint, coords.z);
		coords.x = coords.x - 1;
		coords.y = coords.y - 1;
		if ((((nw.lat > 12) || (nw.lat < -57)) || ((nw.lng > -28) || (nw.lng < -80))) &&
			(((se.lat > 12) || (se.lat < -57)) || ((se.lng > -28) || (se.lng < -80)))) return true;
		return false;
	},
		
	armarCoords: function(coords, fueraDeLimites) {
		return coords.z + "/" + coords.x + "/" + coords.y;
	},
	
	createTile: function(coords, done) {
        var tile = document.createElement('div');
		var id = coords.z + '' + coords.x + '' + coords.y;
		this._coords[id] = coords;		
		var fueraDeLimites = this.fueraDeLimites(coords);
		var coord = this.armarCoords(coords, fueraDeLimites);
		tile.dataset.id = id;
		tile.dataset.frames = "";
		if (PE.RadSat.opciones.transicionesSuaves)
			tile.style.transition = "background-image .2s ease-in-out";
		tile.style.visibility = "visible";
		if (tile.dataset.frames != "") tile.dataset.frames += ",";
		tile.dataset.frames += PE.RadSat.animacion.frameActual;
		var img = document.createElement('img');
		img.src = this.urlActual(coord, fueraDeLimites);
		img.onload = this._cargarImagen(img, tile, PE.RadSat.animacion.frameActual);
		img.onerror = this._errorImagen(img);
		this._loadedTiles[id] = tile;		
        return tile;
    },
	
	_dibujarFrame: function() {
		for (var id in this._loadedTiles) {
			var tile = this._loadedTiles[id];
			if (!tile.dataset) return;
			var fueraDeLimites = this.fueraDeLimites(this._coords[id]);
			var coord = this.armarCoords(this._coords[id], fueraDeLimites);
			var frames = tile.dataset.frames.split(",");
			if (jQuery.inArray(PE.RadSat.animacion.frameActual.toString(), frames) == -1) {
				var img = document.createElement('img');
				img.src = this.urlActual(coord, fueraDeLimites);
				img.onload = this._cargarImagen(img, tile, PE.RadSat.animacion.frameActual);
				img.onerror = this._errorImagen(img);
				if (tile.dataset.frames != "") tile.dataset.frames += ",";
				tile.dataset.frames += PE.RadSat.animacion.frameActual;
			} else tile.style.backgroundImage = "url(" + this.urlActual(coord, fueraDeLimites) + ")";
		}
	}
});

L.Control.Titulo = L.Control.extend({

	_estilo: "radar",
	
    options: {
        position: 'topleft'
    },

	estilo: function(estilo) {
		this._div_titulo.className = "radsat-titulo" + PE.RadSat.cssSufijo() + " radsat-titulo-" + estilo;
		this._estilo = estilo;
	},
	
	titulo: function(titulo) {
		this._div_titulo.innerHTML = titulo;
	},
	
	rango: function(rango) {
		this._div_rango.innerHTML = rango;
		if (rango == "") 
			this._div_rango.style.visibility = "hidden";
		else
			this._div_rango.style.visibility = "visible";
	},
	
    onAdd: function (map) {
        this._div_encabezado = document.createElement('div');
        this._div_bg = document.createElement('div');
		this._div_titulo = document.createElement('div');
		this._div_titulo.id = 'radsat-titulo';
		this._div_rango = document.createElement('div');
		this._div_bg.appendChild(this._div_titulo);
		this._div_bg.appendChild(this._div_rango);
		this._div_clear = document.createElement('div');
		this._div_clear.style.clear = 'both';
		this._div_bg.appendChild(this._div_clear);
		this._a_radsat = document.createElement('a');
		this._a_radsat.href = "//www.pronosticoextendido.net/radsat/";
		this._a_radsat.target = "_blank";
		this._img_radsat = document.createElement('img');
		this._img_radsat.src = '//www.pronosticoextendido.net/recursos/imagenes/iconos/radsat/radsat-logo-resp.png';
		this._a_radsat.appendChild(this._img_radsat);
		this._div_encabezado.appendChild(this._a_radsat);
		this._div_encabezado.appendChild(document.createElement('br'));
		this._div_encabezado.appendChild(this._div_bg);
		this._ventanaCambiada();
        return this._div_encabezado;
    },
	
	_ventanaCambiada: function() {
		if (this._div_encabezado == null) return;
        this._div_encabezado.className = 'radsat-encabezado-bg' + PE.RadSat.cssSufijo();
        this._div_bg.className = 'radsat-titulo-bg' + PE.RadSat.cssSufijo();
		this._div_rango.id = 'radsat-rango' + PE.RadSat.cssSufijo();
		this._a_radsat.className = 'radsat-logo' + PE.RadSat.cssSufijo();
		this.estilo(this._estilo);
		if (this._div_tipos_eventos != null )
			this._div_tipos_eventos.id = 'radsat-tipos-eventos-inset' + PE.RadSat.cssSufijo();
		if (this._div_avisos != null) this._div_avisos.className = 'radsat-tipos-eventos' + PE.RadSat.cssSufijo();
		if (this._div_alertas != null) this._div_alertas.className = 'radsat-tipos-eventos' + PE.RadSat.cssSufijo();
		if (this._div_rangos_radar != null) this._div_rangos_radar.className = 'radsat-rangos radsat-tipos-eventos' + PE.RadSat.cssSufijo();
		if (this._div_rangos_sat != null) this._div_rangos_sat.className = 'radsat-rangos radsat-tipos-eventos' + PE.RadSat.cssSufijo();
		if (this._div_rangos_capas != null) this._div_rangos_capas.className = 'radsat-rangos radsat-tipos-eventos' + PE.RadSat.cssSufijo();
	},
	
	_crearTiposEventos: function() {
		if (this._div_tipos_eventos == null ) {
			this._div_tipos_eventos = document.createElement('div');
			this._div_tipos_eventos.id = 'radsat-tipos-eventos-inset' + PE.RadSat.cssSufijo();
			this._div_encabezado.appendChild(this._div_tipos_eventos);
		}
		if (this._div_avisos != null) return;
		div = document.createElement('div');
		div.className = 'radsat-rangos radsat-tipos-eventos' + PE.RadSat.cssSufijo();
		this._div_tipos_eventos.appendChild(div);
		this._div_rangos_radar = div;
		div = document.createElement('div');
		div.className = 'radsat-rangos radsat-tipos-eventos' + PE.RadSat.cssSufijo();
		this._div_tipos_eventos.appendChild(div);
		this._div_rangos_sat = div;
		div = document.createElement('div');
		div.className = 'radsat-rangos radsat-tipos-eventos' + PE.RadSat.cssSufijo();
		this._div_tipos_eventos.appendChild(div);
		this._div_rangos_capas = div;
		div = document.createElement('div');
		div.className = 'radsat-tipos-eventos' + PE.RadSat.cssSufijo();
		this._div_tipos_eventos.appendChild(div);
		this._div_avisos = div;
		div = document.createElement('div');
		div.className = 'radsat-tipos-eventos' + PE.RadSat.cssSufijo();
		this._div_tipos_eventos.appendChild(div);
		this._div_alertas = div;
	},
	
	_actualizarTiposEventos: function(tipo, info) {
		this._crearTiposEventos();
		var div = null;
		if (tipo == 6) div = this._div_alertas;
		if (tipo == 2) div = this._div_avisos;
		if (tipo == 5) div = this._div_rangos_radar;
		if (tipo == 7) div = this._div_rangos_sat;
		if (tipo == 8) div = this._div_rangos_capas;
		div.style.visibility = 'visible';
		var s = '';
		var pref = '';
		if (PE.RadSat.opciones.idioma == "en") pref = "en-";
		if (PE.RadSat.opciones.idioma == "pt") pref = "pt-";
		if (tipo == 5)
			s += '<table class="radsat-tipos-eventos-tabla"><tr><td>' + PE.RadSat.textos.lluvias + ':</td><td><img src="//www.pronosticoextendido.net/recursos/imagenes/mapas/' + pref + 'radar-rangos-resp.png" style="width: 200px; height: 23px" class="radsat-radar-rangos' + PE.RadSat.cssSufijo() + '" /></td></tr></table>';
		else
		if (tipo == 7)
			s += '<table class="radsat-tipos-eventos-tabla"><tr><td>' + PE.RadSat.textos.nubes + ':</td><td><img src="//www.pronosticoextendido.net/recursos/imagenes/mapas/' + pref + info + '-rangos-resp.png" style="width: 200px; height: 23px" class="radsat-radar-rangos' + PE.RadSat.cssSufijo() + '" /></td></tr></table>';
		else
		if (tipo == 8)
			s += '<img src="//www.pronosticoextendido.net/recursos/imagenes/mapas/' + pref + info + '-rangos-resp.png" style="width: 200px; height: 23px" class="radsat-radar-rangos' + PE.RadSat.cssSufijo() + '" />';
		else
		if (info.length > 0) {
			s += '<table class="radsat-tipos-eventos-tabla"><tr>';
			for (var i = 0; i < info.length; i++) {
				if (tipo == 2)
					s += '<td><div class="radsat-tipos-eventos-color-acp" style="border-color: ' + info[i]['color'] + '"></div></td>';
				else
					s += '<td><div class="radsat-tipos-eventos-color" style="background-color: ' + info[i]['color'] + '"></div></td>';
				s += '<td>' + info[i]['tipoAlerta'] + ' por ' + info[i]['tipo'].toLowerCase() + '&nbsp;&nbsp;&nbsp;&nbsp;</td>';
				if ((i + 1) % 3 == 0) 
					s += '</tr><tr>';
			}
			s += '</tr></table>';
		}
		div.innerHTML = s;
	},
	

	actualizarTiposEventos: function(tipo, mostrar, info) {
		if (mostrar) {
			if (tipo == 2) { // Avisos
				data = new Array();
				colores = new Array();
				for (var i = 0; i < PE.RadSat.avisos._avisos.length; i++) {
					if (jQuery.inArray(jQuery(PE.RadSat.avisos._avisos[i]).attr("color"), colores) == -1) {
						item = new Array();
						item['tipoAlerta'] = 'Aviso';
						item['tipo'] = jQuery(PE.RadSat.avisos._avisos[i]).attr("tipo").split("con")[0].split(",")[0];
						item['color'] = jQuery(PE.RadSat.avisos._avisos[i]).attr("color");
						data.push(item);
						colores.push(item['color']);
					}
				}
				this._actualizarTiposEventos(tipo, data);
			} else
			if (tipo == 6) { // Alertas
				data = new Array();
				colores = new Array();
				if (PE.RadSat.alertas._alertas != null) {
					for (var i = 0; i < PE.RadSat.alertas._alertas.length; i++) {
						if (jQuery.inArray(jQuery(PE.RadSat.alertas._alertas[i]).attr("color"), colores) == -1) {
							item = new Array();
							item['tipoAlerta'] = 'Alerta';
							item['tipo'] = jQuery(PE.RadSat.alertas._alertas[i]).attr("tipo");
							item['color'] = jQuery(PE.RadSat.alertas._alertas[i]).attr("color");
							data.push(item);
							colores.push(item['color']);
						}
					}
				}
				if (PE.RadSat.alertas._alertasuy != null) {
					for (var i = 0; i < PE.RadSat.alertas._alertasuy.length; i++) {
						color = PE.RadSat.alertas._alertasuy[i].advertencia;
						if (color == 2) color = "#ed3";
						if (color == 3) color = "#e72";
						if (color == 4) color = "#c22";
						if (jQuery.inArray(color, colores) == -1) {
							item = new Array();
							item['tipoAlerta'] = 'Advertencia';
							item['tipo'] = PE.RadSat.alertas._alertasuy[i].fenomeno.toLowerCase();
							item['color'] = color;
							data.push(item);
							colores.push(item['color']);
						}
					}
				}
				this._actualizarTiposEventos(tipo, data);
			} else
				this._actualizarTiposEventos(tipo, info);
		} else {
			if ((tipo == 6) && (this._div_alertas != null)) this._div_alertas.innerHTML = "";
			if ((tipo == 2) && (this._div_avisos != null)) this._div_avisos.innerHTML = "";
			if ((tipo == 5) && (this._div_rangos_radar != null)) this._div_rangos_radar.innerHTML = "";
			if ((tipo == 7) && (this._div_rangos_sat != null)) this._div_rangos_sat.innerHTML = "";
			if ((tipo == 8) && (this._div_rangos_capas != null)) this._div_rangos_capas.innerHTML = "";
		}
	}	
		
});

String.prototype.padLeft = function (length, character) { 
    return new Array(length - this.length + 1).join(character || ' ') + this; 
};

Date.prototype.formatHM = function () {
	if (PE.RadSat.opciones.idioma == "en")
		return this.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    return [String(this.getHours()).padLeft(2, '0'),
            String(this.getMinutes()).padLeft(2, '0')].join(":");
};

PE = window.PE || {};

PE.RadSat = {
	
	_iniciado: false,
	_fechaBase: new Date(),
	_fechaServidor: new Date(),
	_random: Math.floor(Math.random() * 1000000),
	
	mapa: {
		
		_lat: -35.5,
		_lng: -64,
		_weatherAPIKey: "d522aa97197fd864d36b418f39ebb323",
		
		centrar: function(lat, lng) {
			if (this._mapa)
				this._mapa.setView([lat, lng], this._mapa.getZoom());
			this._lat = lat;
			this._lng = lng;
		},
		
		centrarZoom: function(lat, lng, zoom) {
			if (this._mapa)
				this._mapa.setView([lat, lng], zoom);
			this._lat = lat;
			this._lng = lng;
			this._zoom = zoom;
		},
		
		zoom: function(zoom) {
			if (this._mapa)
				this._mapa.setZoom(zoom);
			this._zoom = zoom;
		},
		
		desactivarZoomRueda: function() {
			this._mapa.scrollWheelZoom.disable();
		},
		
		_alGeolocalizar: function(position) {
			PE.RadSat.mapa.centrar(position.coords.latitude, position.coords.longitude);
		},

		geolocalizar: function() {
			if (navigator.geolocation)
				navigator.geolocation.getCurrentPosition(PE.RadSat.mapa._alGeolocalizar);
		},
		
		_agregarCapa: function(url, pane, zIndex) {
			return L.tileLayer(url, {
				minZoom: 2,
				zIndex: zIndex,
				pane: pane,
				detectRetina: PE.RadSat.opciones.detectarRetina,
				attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
			});
		},	
		
		_obtenerURLSWeather: function(tipo) {
			var that = this;
			jQuery.getJSON('https://wsimap0.weather.com/201205/en-us/1248/0001/capability.json?layer=' + tipo, function(data) { 
				var url = "https://wsimap11.weather.com/201205/en-us/1248/0001/";
				if (that._datosWeather == null)
					that._datosWeather = new Array();
				var urls = new Array();
				if (data.layers[0].v == null) {
					for (var i = 0; i < data.layers[0].m[0].v.length; i++)
						urls[urls.length] = url + data.layers[0].m[0].v[i].c + "/" + tipo + "/0/" + data.layers[0].m[0].v[i].t + "/1/";
				} else {
					for (var i = 0; i < data.layers[0].v.length; i++) 
						urls[urls.length] = url + data.layers[0].v[i].c + "/" + tipo + "/0/" + data.layers[0].v[i].t + "/1/";
				}
				that._datosWeather[tipo] = urls;
			});
		},
		
		_obtenerURLSWeatherAPI: function() {
			if (this._datosWeatherAPI != null) return;
			var that = this;
			jQuery.getJSON('https://api.weather.com/v3/TileServer/series/productSet?apiKey=' + this._weatherAPIKey, function(data) { 
				that._datosWeatherAPI = data;
				if (PE.RadSat.radares._capa != null) PE.RadSat.radares._capa._dibujarFrame();
				if (PE.RadSat.satelite != null) PE.RadSat.satelite._dibujarFrame();
				if (PE.RadSat.capasDatos != null) PE.RadSat.capasDatos._dibujarFrame();
			});
		},
		
		_obtenerURLSRealEarth: function() {
			if (this._datosRealEarth != null) return;
			var that = this;
			jQuery.getJSON('https://realearth.ssec.wisc.edu/api/products?products=G16-ABI-FD-TC.100', function(data) { 
				that._datosRealEarth = data;
				if (PE.RadSat.satelite != null) PE.RadSat.satelite._dibujarFrame();
			});
		},
		
		_agregarCapaWeather: function(tipo, pane, zIndex) {
			var that = this;
			
			jQuery.getJSON('https://wsimap0.weather.com/201205/en-us/1248/0001/capability.json?layer=' + tipo, function(data) { 
				var url = "https://wsimap11.weather.com/201205/en-us/1248/0001/";
				if (data.layers[0].v == null)
					url += data.layers[0].m[0].v[0].c + "/" + tipo + "/0/" + data.layers[0].m[0].v[0].t + "/1/";
				else
					url += data.layers[0].v[0].c + "/" + tipo + "/0/" + data.layers[0].v[0].t + "/1/";
				that._capaBase = L.tileLayer(url + "{z}/{x}/{y}/layer.png", {
					tms: true,
					minZoom: 2,
					zIndex: zIndex,
					pane: pane,
					detectRetina: PE.RadSat.opciones.detectarRetina, 
					attribution: '<a href="http://weather.com" target="_blank">The Weather Channel</a>'
				});
				if (PE.RadSat.opciones.tipoMapa == 3) that._capaBase.addTo(that._mapa);
				PE.RadSat._cargar();
			});
		},

		_agregarCapaGoogle: function(url, minZoom, maxZoom, opacidad, zIndex, pane, agregar) {
			capa = L.tileLayer(url + "&x={x}&y={y}&z={z}", {
				transparent: true,
				opacity: opacidad,
				minZoom: minZoom,
				maxZoom: maxZoom,
				zIndex: zIndex,
				pane: pane,
				detectRetina: PE.RadSat.opciones.detectarRetina, 
				attribution: '<a href="http://www.google.com" target="_blank">Google</a>'
			});
			if (agregar) capa.addTo(this._mapa);
			return capa;
		},
		
		_agregarCapaEtiquetas: function() {
			if (PE.RadSat.opciones.integrarEtiquetas) return;
			if (this._capaEtiquetas)
				this._mapa.removeLayer(this._capaEtiquetas);
			var src = "https://mt0.google.com/vt/v=apt.116&s=G&lyrs=h&hl=" + PE.RadSat.opciones.idioma + "&apistyle=";
			if ((PE.RadSat.opciones.verPronostico) || (!PE.RadSat.opciones.verLocalidades))
				src = src + "s.t%3A19%7C%7Cp.v%3Aoff%2Cs.t%3A2%7C%7Cp.v%3Aoff%2C";
			if (!PE.RadSat.opciones.verRutas)
				src = src + "s.t%3A3%7Cp.v%3Aoff%2C";
			else
				src = src + "s.t%3A3%7Cs.e%3Ag%7Cp.c%3A%23ff99aa88%7Cp.v%3Asimplified%2C";
			if ((PE.RadSat.opciones.tipoMapa == 1) && ((!PE.RadSat.opciones.verSatelite) || (PE.RadSat.opciones.tipoSatelite < 3)))
				src += "s.t%3A17%7Cs.e%3Ag%7Cp.w%3A1.25%7Cp.c%3A%23ff111111%2Cs.t%3A18%7Cs.e%3Ag%7Cp.w%3A0.9%7Cp.s%3A1%7Cp.c%3A%23ff444444%2C";
			else
				src += "s.t%3A17%7Cs.e%3Ag%7Cp.w%3A1.25%7Cp.c%3A%23ffffffff%2Cs.t%3A18%7Cs.e%3Ag%7Cp.w%3A0.9%7Cp.s%3A1%7Cp.c%3A%23ffcccccc%2C";
			this._capaEtiquetas = this._agregarCapaGoogle(src, 2, 18, 1, 12, "etiquetas", true);
		},
		
		_crearPane: function(nombre, eventos, zIndex) {
			this._mapa.createPane(nombre);
			this._mapa.getPane(nombre).style.zIndex = zIndex;
			if (!eventos)
				this._mapa.getPane(nombre).style.pointerEvents = "none";
		},
		
		_iniciar: function(contenedor, zoom) {
			this._mapa = L.map(contenedor, { maxBounds: new L.LatLngBounds(new L.LatLng(85, -180), new L.LatLng(-85, 180)) });
			this._mapa._controlCorners["topcenterright"] = L.DomUtil.create('div', "leaflet-topcenter leaflet-right", this._mapa._controlContainer);
			this._mapa.zoomControl.setPosition("topcenterright");
			this._mapa.on('moveend', this._mapaMoveEnd);
			this._mapa.on('drag', this._mapaDrag);
			this._crearPane("etiquetas", false, 650);
			if (!PE.RadSat.opciones.integrarEtiquetas) {
				this._agregarCapaWeather("0013", "tilePane", -2);
				this._capaDia = this._agregarCapaGoogle("https://maps.google.com/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m3!1e0!2sm!3i394090420!" +
				"3m14!2ses-419!3sUS!5e18!12m1!1e47!12m3!1e37!2m1!1ssmartmaps!12m4!1e26!2m2!1sstyles!" +
				"2zcy50OjF8cC52Om9mZixzLnQ6M3xwLnY6b2ZmLHMudDoyfHAudjpvZmYscy50OjV8cC5jOiNmZkQwQ0VDMSxzLnQ6NnxwLmM6I2ZmM0U2NjlDLH" +
				"MudDo2fHMuZTpsfHAudjpvZmY!4e0&token=75661", 2, 18, 1, -2, "tilePane", false);
				this._capaNoche = this._agregarCapaGoogle("https://maps.google.com/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m3!1e0!2sm!3i378067392!" +
				"3m14!2ses-419!3sUS!5e18!12m1!1e47!12m3!1e37!2m1!1ssmartmaps!12m4!1e26!2m2!1sstyles!" +
				"2zcy50OjF8cC52Om9mZixzLnQ6M3xwLnY6b2ZmLHMudDoyfHAudjpvZmYscy50OjV8cC5jOiNmZjAwMDAwMCxzLnQ6NnxwLmM6I2ZmMjA0RDZDLH" +
				"MudDo2fHMuZTpsfHAudjpvZmY!4e0&token=106863", 2, 18, 1, -2, "tilePane", false);
			} else {
				this._agregarCapaWeather("0015", "tilePane", -2);
				this._capaDia = this._agregarCapaGoogle("//maps.google.com/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m3!1e0!2sm!3i3780676443i378067536!" +
				"3m14!2ses-419!3sUS!5e18!12m1!1e47!12m3!1e37!2m1!1ssmartmaps!12m4!1e26!2m2!1sstyles!" +
				"2zcy50OjV8cC5jOiNmZkNDQ0JCOSxzLnQ6NnxwLmM6I2ZmMkY1MTg1LHMudDo2fHMuZTpsfHAudjpvZmY!4e0&token=12870", 2, 18, 1, -2, "tilePane", false);
				this._capaNoche = this._agregarCapaGoogle("//maps.google.com/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m3!1e0!2sm!3i378067392!" +
				"3m14!2ses-419!3sUS!5e18!12m1!1e47!12m3!1e37!2m1!1ssmartmaps!12m4!1e26!2m2!1sstyles!" +
				"2zcy50OjV8cC5jOiNmZjAwMDAwMCxzLnQ6NnxwLmM6I2ZmMjA0RDZDLHMudDo2fHMuZTpsfHAudjpvZmY!4e0&token=113064", 2, 18, 1, -2, "tilePane", false);
			}
			this.zoom(zoom);
		},
		
		tipo: function(tipo) {
			PE.RadSat.opciones.tipoMapa = tipo;
			if (this._capaDia != null) this._mapa.removeLayer(this._capaDia);
			if (this._capaNoche != null) this._mapa.removeLayer(this._capaNoche);
			if (this._capaBase != null) this._mapa.removeLayer(this._capaBase);
			if (tipo == 1) this._capaDia.addTo(this._mapa);
			if (tipo == 2) this._capaNoche.addTo(this._mapa);
			if (tipo == 3) this._capaBase.addTo(this._mapa);
			if (!PE.RadSat.opciones.integrarEtiquetas)
				PE.RadSat.mapa._agregarCapaEtiquetas();
		},
				
		_mapaMoveEnd: function() {
			if (this._moveTimeout != null)
				window.clearTimeout(this._moveTimeout);
			this._moveTimeout = window.setTimeout(function() {
				PE.RadSat.rayos._actualizar();
				PE.RadSat.pronostico._actualizar();
				PE.RadSat.opciones.guardar();
				if (typeof radsat_AlActualizarMapa == 'function') radsat_AlActualizarMapa();
				if (typeof radsat_AlActualizarMapa2 == 'function') radsat_AlActualizarMapa2();
				if (typeof radsat_AlActualizarMapa3 == 'function') radsat_AlActualizarMapa3();
			}, 500);
		},
		
		paisActualizado: function() {
			if (PE.RadSat.opciones.resaltarPais) {
				this.resaltarPais(false);
				if ((!PE.ubicacion) || (PE.ubicacion.pais.indexOf("Argentina") > -1) ||
					(PE.ubicacion.pais.indexOf("Uruguay") > -1) || (PE.ubicacion.pais.indexOf("Paraguay") > -1))
					this.resaltarPais(true);
			}
			if (PE.RadSat.opciones.resaltarProvincias) {
				this.resaltarProvincias(false);
				if ((!PE.ubicacion) || (PE.ubicacion.pais.indexOf("Argentina") > -1) ||
					(PE.ubicacion.pais.indexOf("Uruguay") > -1) || (PE.ubicacion.pais.indexOf("Paraguay") > -1))
					this.resaltarProvincias(true);
			}
		},
		
		_mapaDrag: function() {
			if (this._moveTimeout != null)
				window.clearTimeout(this._moveTimeout);
		},	
		
		resaltarPais: function(resaltar) {
			PE.RadSat.opciones.resaltarPais = resaltar;
			if (resaltar) {
				// if (PE.RadSat.opciones.modoGlobal) {
					// if (!this._capaPais) this._capaPais = this._agregarCapaLocal("global/pais", 2, 9, 0.4, -1, "tilePane", PE.RadSat.opciones.resaltarPais);
				// } else {
					// if ((!PE.ubicacion) || (PE.ubicacion.pais.indexOf("Argentina") > -1))
						// if (!this._capaPais) this._capaPais = this._agregarCapaLocal("argentina/pais", 2, 9, 0.4, -1, "tilePane", PE.RadSat.opciones.resaltarPais);
					// if ((PE.ubicacion != null) && (PE.ubicacion.pais.indexOf("Uruguay") > -1))
						// if (!this._capaPais) this._capaPais = this._agregarCapaLocal("uruguay/pais", 2, 9, 0.4, -1, "tilePane", PE.RadSat.opciones.resaltarPais);
					// if ((PE.ubicacion != null) && (PE.ubicacion.pais.indexOf("Paraguay") > -1))
						// if (!this._capaPais) this._capaPais = this._agregarCapaLocal("paraguay/pais", 2, 9, 0.4, -1, "tilePane", PE.RadSat.opciones.resaltarPais);
				// }
				// if (this._capaPais != null) this._capaPais.addTo(this._mapa);
			}
			else
				if (this._capaPais != null) this._mapa.removeLayer(this._capaPais);
		},
		
		resaltarProvincias: function(resaltar) {
			PE.RadSat.opciones.resaltarProvincias = resaltar;
			if (resaltar) {
				// if (PE.RadSat.opciones.modoGlobal) {
					// if (!this._capaDepartamentos) this._capaDepartamentos = this._agregarCapaLocal("global/divisiones", 2, 9, 1, 11, "etiquetas", PE.RadSat.opciones.resaltarProvincias);
				// } else {
					// if ((!PE.ubicacion) || (PE.ubicacion.pais.indexOf("Argentina") > -1))
						// if (!this._capaDepartamentos) this._capaDepartamentos = this._agregarCapaLocal("argentina/divisiones", 2, 9, 1, 11, "etiquetas", PE.RadSat.opciones.resaltarProvincias);
					// if ((PE.ubicacion != null) && (PE.ubicacion.pais.indexOf("Uruguay") > -1))
						// if (!this._capaDepartamentos) this._capaDepartamentos = this._agregarCapaLocal("uruguay/divisiones", 2, 9, 1, 11, "etiquetas", PE.RadSat.opciones.resaltarProvincias);
					// if ((PE.ubicacion != null) && (PE.ubicacion.pais.indexOf("Paraguay") > -1))
						// if (!this._capaDepartamentos) this._capaDepartamentos = this._agregarCapaLocal("paraguay/divisiones", 2, 9, 1, 11, "etiquetas", PE.RadSat.opciones.resaltarProvincias);
				// }
				// if (this._capaProvincias != null) this._capaProvincias.addTo(this._mapa);
				// if (this._capaDepartamentos != null) this._capaDepartamentos.addTo(this._mapa);
			}
			else {
				if (this._capaProvincias != null) this._mapa.removeLayer(this._capaProvincias);
				if (this._capaDepartamentos != null) this._mapa.removeLayer(this._capaDepartamentos);
			}
			this._agregarCapaEtiquetas();
		},
		
		verLocalidades: function(ver) {
			PE.RadSat.opciones.verLocalidades = ver;
			this._agregarCapaEtiquetas();
		},
		
		verRutas: function(ver) {
			PE.RadSat.opciones.verRutas = ver;
			this._agregarCapaEtiquetas();
		}
		
	},
	
	alertas: {
	
		_agregar: function(data, origen) {
			if (data == null) return;
			if (data.length > 0)
				if (!PE.RadSat.mapa._mapa.getPane("alertas"))
					PE.RadSat.mapa._crearPane("alertas", true, 210);
			for (var i = 0; i < data.length; i++) {
				latlng = new Array();
				for (var j = 0; j < data[i].shape.length; j++)
					latlng.push(new L.latLng(data[i].shape[j].lt, data[i].shape[j].lg));
				if (origen == 1) {
					color = jQuery(this._alertas[data[i].indice]).attr("color");
					attr = '<a href="http://www.smn.gov.ar" target="_blank">Servicio Meteorológico Nacional</a>';
				}
				if (origen == 2) {
					var tit = this._alertasbr[data[i].indice].childNodes[1].innerHTML;
					color = "#db3";
					if (tit.endsWith("Perigo")) color = "#e72";
					attr = '<a href="http://www.inmet.gov.br" target="_blank">INMET</a>';
				}
				if (origen == 3) {
					color = this._alertasuy[data[i].indice].advertencia;
					if (color == 2) color = "#ed3";
					if (color == 3) color = "#e72";
					if (color == 4) color = "#c22";
					attr = '<a href="http://www.meteorologia.com.uy" target="_blank">INUMET</a>';
				}
				if (origen == 4) {
					color = "#db3";
					attr = '<a href="http://www.aemet.es" target="_blank">AEMET</a>';
				}
				var poly = L.polygon(latlng, {
					stroke: false,
					geodesic: true,
					fillColor: color,
					fillOpacity: 0.8,
					zIndex: 5,
					pane: "alertas",
					attribution: attr
				});
				this._polys[this._polys.length] = poly;
				var indice = data[i].indice;
				var that = this;
				poly.on("click", function (e) {
					PE.RadSat._popup.setLatLng(e.latlng);
					if (origen == 1)
						PE.RadSat._popup.setContent('<div class="radsat-popup-titulo"><b>Alerta por ' + 
						jQuery(that._alertas[indice]).attr("tipo") + '</b><br />' + jQuery(that._alertas[indice]).attr("zonas") + '</div>' +
						'<div class="radsat-popup-contenido">' + jQuery(that._alertas[indice]).attr("descripcion") + '</div>' +
						'<a href="//www.pronosticoextendido.net/alertas/detalle/' + jQuery(that._alertas[indice]).attr("id") + '/" target="_blank">Ver detalle del alerta</a>');
					if (origen == 3) {
						for (var x = 0; x < that._alertasuy[indice].deptos.length; x++) that._alertasuy[indice].deptos[x] = that._alertasuy[indice].deptos[x].charAt(0).toUpperCase() + that._alertasuy[indice].deptos[x].slice(1);
						deptos = that._alertasuy[indice].deptos.join(', ');
						deptos = deptos.replace("Cerrolargo", "Cerro Largo").replace("Treintaytres", "Treinta y Tres").replace("Rionegro", "Rio Negro").replace("Sanjose", "San José");
						PE.RadSat._popup.setContent('<div class="radsat-popup-titulo"><b>Advertencia por ' + 
						that._alertasuy[indice].fenomeno.toLowerCase() + '</b><br />' + deptos + '</div>' +
						'<div class="radsat-popup-contenido">' + that._alertasuy[indice].textoAdv + '</div>');
					}
					PE.RadSat._popup.openOn(PE.RadSat.mapa._mapa);
				});
				poly.addTo(PE.RadSat.mapa._mapa);
			}
			if (this._filtrarid != null) {
				PE.RadSat.mapa._mapa.fitBounds((new L.featureGroup(this._polys)).getBounds());
			}
		},
		
		_agregarPoly: function(data, origen) {
			if (data == null) return;
			if (!PE.RadSat.mapa._mapa.getPane("alertas"))
				PE.RadSat.mapa._crearPane("alertas", true, 210);
			latlng = new Array();
			if (origen == 1) {
				jQuery(jQuery(data).find("polygon").html().split(" ")).each(function() {
					latlng.push(new L.latLng(this.split(",")[0], this.split(",")[1]));
				});
				color = jQuery(data).find("parameter")[0].childNodes[1].innerHTML;
				attr = '<a href="http://www.inmet.gov.br" target="_blank">INMET</a>';
			}
			if (origen == 2) {
				jQuery(data.geometry.coordinates[0][0]).each(function() {
					latlng.push(new L.latLng(this[1], this[0]));
				});
				color = "#db3";
				attr = '<a href="http://www.aemet.es" target="_blank">AEMET</a>';
			}
			var poly = L.polygon(latlng, {
				stroke: false,
				geodesic: true,
				fillColor: color,
				fillOpacity: 0.8,
				zIndex: 5,
				pane: "alertas",
				attribution: attr
			});
			this._polys[this._polys.length] = poly;
			var that = data;
			var thatthat = this;
			poly.on("click", function (e) {
				PE.RadSat._popup.setLatLng(e.latlng);
				if (origen == 1)
					PE.RadSat._popup.setContent('<div class="radsat-popup-titulo"><b>' + 
					jQuery(that).find("headline").html() + '</b><br /></div>' +
					'<div class="radsat-popup-contenido">' + jQuery(that).find("areaDesc").html() + '</div>' +
					'<a href="//www.pronosticoextendido.net/alertas/?ver=Brasil" target="_blank">Ver detalle</a>');
				else {
					for (var i = 0; i < thatthat._alertases.length; i++) {
						if (thatthat._alertases[i].id == parseInt(that.properties.id_prov)) {
							PE.RadSat._popup.setContent('<div class="radsat-popup-titulo"><b>' + 
							thatthat._alertases[i].etiqueta + '</b><br /></div>' +
							'<div class="radsat-popup-contenido">' + thatthat._alertases[i].fuente + '</div>' +
							'<a href="//www.pronosticoextendido.net/alertas/?ver=España" target="_blank">Ver detalle</a>');
						}
					}
				}
				PE.RadSat._popup.openOn(PE.RadSat.mapa._mapa);
			});
			poly.addTo(PE.RadSat.mapa._mapa);
		},
		

		_agregarPolyUY: function(data) {
			if (data == null) return;
			if (!PE.RadSat.mapa._mapa.getPane("alertas"))
				PE.RadSat.mapa._crearPane("alertas", true, 210);
			color = "#db3";
			if ((data.riesgoFenomeno.riesgoViento > 3) ||
				(data.riesgoFenomeno.riesgoLluvia > 3) ||
				(data.riesgoFenomeno.riesgoTormenta > 3) ||
				(data.riesgoFenomeno.riesgoVisibilidad > 3) ||
				(data.riesgoFenomeno.riesgoCalor > 3) ||
				(data.riesgoFenomeno.riesgoFrio > 3))
				color = "#c22";
			else
			if ((data.riesgoFenomeno.riesgoViento > 2) ||
				(data.riesgoFenomeno.riesgoLluvia > 2) ||
				(data.riesgoFenomeno.riesgoTormenta > 2) ||
				(data.riesgoFenomeno.riesgoVisibilidad > 2) ||
				(data.riesgoFenomeno.riesgoCalor > 2) ||
				(data.riesgoFenomeno.riesgoFrio > 2))
				color = "#e72";
			else
			if ((data.riesgoFenomeno.riesgoViento > 1) ||
				(data.riesgoFenomeno.riesgoLluvia > 1) ||
				(data.riesgoFenomeno.riesgoTormenta > 1) ||
				(data.riesgoFenomeno.riesgoVisibilidad > 1) ||
				(data.riesgoFenomeno.riesgoCalor > 1) ||
				(data.riesgoFenomeno.riesgoFrio > 1))
				color = "#ed3";
			attr = '<a href="http://www.inumet.gub.uy" target="_blank">INUMET</a>';
			for (var j = 0; j < data.coordsPoligonos.length; j++) {
				latlng = new Array();
				for (var i = 0; i < data.coordsPoligonos[j].length; i++) 
					latlng.push(new L.latLng(data.coordsPoligonos[j][i].lat, data.coordsPoligonos[j][i].lng));
				var poly = L.polygon(latlng, {
					stroke: false,
					geodesic: true,
					fillColor: color,
					fillOpacity: 0.8,
					zIndex: 5,
					pane: "alertas",
					attribution: attr
				});
				this._polys[this._polys.length] = poly;
				var that = data;
				var thatthat = this;
				poly.on("click", function (e) {
					PE.RadSat._popup.setLatLng(e.latlng);
					if (origen == 1)
						PE.RadSat._popup.setContent('<div class="radsat-popup-titulo"><b>' + 
						jQuery(that).find("headline").html() + '</b><br /></div>' +
						'<div class="radsat-popup-contenido">' + jQuery(that).find("areaDesc").html() + '</div>' +
						'<a href="//www.pronosticoextendido.net/alertas/?ver=Brasil" target="_blank">Ver detalle</a>');
					else {
						for (var i = 0; i < thatthat._alertases.length; i++) {
							if (thatthat._alertases[i].id == parseInt(that.properties.id_prov)) {
								PE.RadSat._popup.setContent('<div class="radsat-popup-titulo"><b>' + 
								thatthat._alertases[i].etiqueta + '</b><br /></div>' +
								'<div class="radsat-popup-contenido">' + thatthat._alertases[i].fuente + '</div>' +
								'<a href="//www.pronosticoextendido.net/alertas/?ver=España" target="_blank">Ver detalle</a>');
							}
						}
					}
					PE.RadSat._popup.openOn(PE.RadSat.mapa._mapa);
				});
				poly.addTo(PE.RadSat.mapa._mapa);			
			}
		},
		
		_agregarLimiteAR: function(data) {
			this._alertas[this._alertas.length] = data;
			if ((this._filtrarid != null) && (data.id != this._filtrarid)) return;
			var that = this;
			var prov = jQuery(data).attr("provincias").split(',');
			var provs = "";
			for (var j = 0; j < prov.length; j++) {
				if (provs != "") provs = provs + ",";
				provs += "'" + prov[j].trim() + "'";
			}
			jQuery.getJSON('//www.pronosticoextendido.net/servicios/obtener-limites.php?tipo=1&indice=' + (this._alertas.length - 1) + 
			'&nombres=' + provs, function(data) { 
				that._agregar(data, 1);
			});			
		},
		
		_agregarLimiteBR: function(data) {
			this._alertasbr[this._alertasbr.length] = data;
			var that = this;
			jQuery.ajax({
				url: data.childNodes[3].innerHTML,
				dataType: 'xml',
				success: function(data) {
					that._agregarPoly(data, 1);
				}
			});
		},
		
		_agregarLimiteUY: function(data) {
			for (var i = 0; i < data.length; i++) {
				this._alertasuy[this._alertasuy.length] = data[i];
				this._agregarPolyUY(data[i]);
				PE.RadSat.encabezado.actualizarTiposAlertas(true);
			}
		},
		
		_agregarLimiteES: function(data) {
			this._alertases = data;
			var that = this;
			jQuery.getJSON('https://services.meteored.com/web/warnings/css/18_0.geo.json', function(data) { 
				for (var i = 0; i < data.features.length; i++)
					that._agregarPoly(data.features[i], 2);
			});
			PE.RadSat.encabezado.actualizarTiposAlertas(true);
		},
		
		_agregarLimiteUS: function(data) {
			this._alertases = data;
			var that = this;
			jQuery.getJSON('https://services.meteored.com/web/warnings/css/58_0.geo.json', function(data) { 
				for (var i = 0; i < data.features.length; i++)
					that._agregarPoly(data.features[i], 2);
			});
			PE.RadSat.encabezado.actualizarTiposAlertas(true);
		},
		
		_leerAlertasAR: function() {
			var that = this;
			jQuery.ajax({
				url: '//www.pronosticoextendido.net/servicios/alertas.xml',
				dataType: 'xml',
				success: function(data){
					var xml = jQuery('alertas', data);
					jQuery(xml).find("alerta").each(function() {
						that._agregarLimiteAR(this);
					});
					PE.RadSat.encabezado.actualizarTiposAlertas(true);
				}
			});
		},
		
		_leerAlertasBR: function() {
			var that = this;
			jQuery.ajax({url: '//www.pronosticoextendido.net/servicios/obtener-alertas-br.php', dataType: 'xml', success: function(data) {
				$(data).find("item").each(function() {
					var desc = this.childNodes[5].innerHTML;
					var inicio = desc.indexOf("cio</th>") + 12;
					var fin = desc.indexOf("</td></tr><tr><th align=\"left\">Fim");
					var fecha = desc.substring(inicio, fin);
					if ((new Date(fecha)) <= (new Date())) {
						inicio = desc.indexOf("Fim</th>") + 12;
						fin = desc.indexOf("</td></tr><tr><th align=\"left\">Descri");
						fecha = desc.substring(inicio, fin);
						if ((new Date(fecha)) > (new Date()))
							that._agregarLimiteBR(this);
					}
					PE.RadSat.encabezado.actualizarTiposAlertas(true);
				});
			}});
		},
		
		_leerAlertasUY: function() {
			var that = this;
			jQuery.getJSON('//www.pronosticoextendido.net/servicios/obtener-alertas-uy.php', function(data) {
				that._agregarLimiteUY(data.advertencias);
			});
		},
		
		_leerAlertasES: function() {
			var that = this;
			jQuery.getJSON('//www.pronosticoextendido.net/servicios/obtener-alertas-es.php', function(data) {
				that._agregarLimiteES(data.alertas);
			});
		},
		
		_leerAlertasUS: function() {
			var that = this;
			jQuery.getJSON('//www.pronosticoextendido.net/servicios/obtener-alertas-us.php', function(data) {
				that._agregarLimiteUS(data.alertas);
			});
		},
		
		
		mostrar: function(mostrar) {
			if (PE.RadSat.opciones.verAlertas == mostrar) return;
			PE.RadSat.opciones.verAlertas = mostrar;
			PE.RadSat.encabezado.actualizar();
			if (mostrar) {
				if (this._polys != null) return;
				this._polys = new Array();
				this._alertas = new Array();
				this._alertasbr = new Array();
				this._alertasuy = new Array();
				this._alertases = new Array();
				this._alertasus = new Array();
				if ((!PE.ubicacion) || (PE.ubicacion.pais.indexOf("Argentina") > -1)) {
					if ((!PE.alertas) || (!PE.alertas.items)) {
						this._leerAlertasAR();
					} else {
						for (var i = 0; i < PE.alertas.items.length; i++)
							this._agregarLimiteAR(PE.alertas.items[i]);
						PE.RadSat.encabezado.actualizarTiposAlertas(true);
					}
				}
				if ((PE.ubicacion != null) && ((PE.ubicacion.pais.indexOf("Brasil") > -1) || (PE.ubicacion.pais.indexOf("Brazil") > -1))) this._leerAlertasBR();
				if ((PE.ubicacion != null) && (PE.ubicacion.pais.indexOf("Uruguay") > -1)) this._leerAlertasUY();
				if ((PE.ubicacion != null) && ((PE.ubicacion.pais.indexOf("España") > -1) || (PE.ubicacion.pais.indexOf("Spain") > -1))) this._leerAlertasES();
				if ((PE.ubicacion != null) && ((PE.ubicacion.pais.indexOf("Estados Unidos") > -1) || (PE.ubicacion.pais.indexOf("United States") > -1))) this._leerAlertasUS();
			} else {
				if (this._polys == null) return;
				for (var i = 0; i < this._polys.length; i++)
					PE.RadSat.mapa._mapa.removeLayer(this._polys[i]);
				this._polys.length = 0;
				this._polys = null;
				this._alertas = null;
				this._alertasbr = null;
				this._alertasuy = null;
				this._alertases = null;
				this._alertasus = null;
				this._filtrarid = null;
				PE.RadSat.encabezado.actualizarTiposAlertas(false);
			}
		},
		
		mostrarID: function(id) {
			this._filtrarid = id;
			this.mostrar(true);
		}		
		
	},
	
	avisos: {
	
		_agregar: function(data) {
			if (data == null) return;
			if (!PE.RadSat.mapa._mapa.getPane("avisos"))
				PE.RadSat.mapa._crearPane("avisos", true, 290);
			if (!PE.RadSat.mapa._mapa.getPane("avisos"))
				PE.RadSat.mapa._crearPane("avisos", true, 290);
			if (!PE.RadSat.mapa._mapa.getPane("sombras"))
				PE.RadSat.mapa._crearPane("sombras", false, 280);
			if (PE.RadSat.opciones.destacarFondoAvisos)
				if (!PE.RadSat.mapa._mapa.getPane("avisosbg"))
					PE.RadSat.mapa._crearPane("avisosbg", false, 215);
			latlng = new Array();
			een = 0;
			ll = "";
			jQuery(jQuery(data).attr("area").split(" ")).each(function() {
				if (een == 1)
					latlng.push(L.latLng(ll, this));
				else 
					ll = this;
				if (een == 0) een = 1; else een = 0;
			});
			var tipo = jQuery(data).attr("tipo");
			var descrip = jQuery(data).attr("departamentos");
			var id = jQuery(data).attr("id");
			var color = jQuery(data).attr("color");
			var poly = L.polygon(latlng, {
				stroke: true,
				geodesic: true,
				color: color,
				weight: 3,
				fillColor: color,
				fillOpacity: 0.02,
				zIndex: 10,
				pane: "avisos",
				attribution: '<a href="http://www.smn.gov.ar" target="_blank">Servicio Meteorológico Nacional</a>'
			});
			this._avisos[this._avisos.length] = data;
			this._polys[this._polys.length] = poly;
			poly.on("click", function (e) {
				PE.RadSat._popup.setLatLng(e.latlng);
				PE.RadSat._popup.setContent('<div class="radsat-popup-titulo"><b>Aviso a corto plazo</b><br />' + tipo + '</div>' +
				'<div class="radsat-popup-contenido">' + descrip + '</div>' +
				'<a href="//www.pronosticoextendido.net/alertas/detalle/' + id+ '/" target="_blank">Ver detalle del aviso</a>');
				PE.RadSat._popup.openOn(PE.RadSat.mapa._mapa);
			});
			poly.addTo(PE.RadSat.mapa._mapa);
			poly = L.polygon(latlng, {
				stroke: true,
				geodesic: true,
				color: "#000000",
				weight: 4.5,
				opacity: 1,
				fillOpacity: 0.01,
				pane: "sombras",
				zIndex: 10
			});
			this._polys[this._polys.length] = poly;
			poly.addTo(PE.RadSat.mapa._mapa);
			if (PE.RadSat.opciones.destacarFondoAvisos) {
				poly = L.polygon(latlng, {
					stroke: false,
					geodesic: true,
					color: color,
					weight: 0,
					fillColor: color,
					fillOpacity: 0.5,
					zIndex: 10,
					pane: "avisosbg"
				});
				this._polys[this._polys.length] = poly;
				poly.addTo(PE.RadSat.mapa._mapa);
			}
			if (this._filtrarid != null)
				PE.RadSat.mapa._mapa.fitBounds(poly.getBounds());
		},
				
		mostrar: function(mostrar) {
			if (PE.RadSat.opciones.verAvisos == mostrar) return;
			PE.RadSat.opciones.verAvisos = mostrar;
			PE.RadSat.encabezado.actualizar();
			if (mostrar) {
				this._polys = new Array();
				this._avisos = new Array();
				if ((!PE.ubicacion) || (PE.ubicacion.pais.indexOf("Argentina") > -1)) {
					var that = this;
					if ((PE.avisos != null) && (PE.avisos._iniciado)) {
						for (var i = 0; i < PE.avisos.items.length; i++)
							if ((that._filtrarid == null) || (jQuery(PE.avisos.items[i]).attr("id") == that._filtrarid)) 
								this._agregar(PE.avisos.items[i]);
						PE.RadSat.encabezado.actualizarTiposAvisos(true);
					} else {
						jQuery.ajax({
							url: '//www.pronosticoextendido.net/servicios/avisos.xml',
							dataType: 'xml',
							success: function(data){
								if (!PE.RadSat.opciones.verAvisos) return;
								var xml = jQuery('avisos', data);
								jQuery(xml).find("aviso").each(function() {
									if ((that._filtrarid == null) || (jQuery(this).attr("id") == that._filtrarid)) 
										that._agregar(this);
								});
								PE.RadSat.encabezado.actualizarTiposAvisos(true);
							}
						});
					}
				}
			} else {
				if (this._polys == null) return;
				for (var i = 0; i < this._polys.length; i++)
					PE.RadSat.mapa._mapa.removeLayer(this._polys[i]);
				this._polys = null;
				this._avisos = null;
				PE.RadSat.encabezado.actualizarTiposAvisos(false);
			}
		},
		
		mostrarID: function(id) {
			this._filtrarid = id;
			this.mostrar(true);
		},
		
		destacarFondo: function(destacar) {
			var visible = PE.RadSat.opciones.verAvisos;
			if (visible) this.mostrar(false);
			PE.RadSat.opciones.destacarFondoAvisos = destacar;
			if (visible) this.mostrar(true);
		}
		
	},
	
	rayos: {
				
		_agregar: function(data) {
			var that = this;
			jQuery(data).find("rayo").each(function() {
				var when = jQuery(this).attr("utc");
				var lat = jQuery(this).attr("lat");
				var lng = jQuery(this).attr("lon");
				var timeAgo = (new Date() - (new Date(Date.parse(when)))) / 1000 / 60;
				if (timeAgo <= 30) {
					var marker = L.marker(L.latLng(lat, lng), {
						title: "Rayo a tierra",
						icon: that._icono,
						opacity: 1 - Math.min(0.98, Math.abs(0 - timeAgo / 15))
					});
					that._marcas[that._marcas.length] = marker;
					that._tiempos[that._tiempos.length] = timeAgo;
					marker.on("click", function (e) {
						PE.RadSat._popup.setLatLng(e.latlng);
						var txt = Math.trunc(timeAgo) + " minutos";
						if (timeAgo < 1) txt = "menos de un minuto"; else
						if (timeAgo < 2) txt = "1 minuto";
						PE.RadSat._popup.setContent('<div class="radsat-popup-titulo"><b>Impacto de rayo a tierra</b><br />Hace ' + txt + "</div>" +
						'<div class="radsat-popup-contenido">' + PE.RadSat.textos.cargando + '</div>');
						PE.RadSat._popup.openOn(PE.RadSat.mapa._mapa);
						jQuery.getJSON('//www.pronosticoextendido.net/servicios/obtener-contenido.php?tipo=5&lat=' + lat + '&lng=' + lng, function(data) { 
							PE.RadSat._popup.setContent('<div class="radsat-popup-titulo"><b>Impacto de rayo a tierra</b><br />Hace ' + txt + "</div>" +
							'<div class="radsat-popup-contenido">' + data[0].contenido + '</div>' +
							'<a href="//www.pronosticoextendido.net/prevencion/rayos/" target="_blank">Cómo protegernos de los rayos</a>');
						});
					});
					marker.addTo(PE.RadSat.mapa._mapa);
				}
			});
		},
			
		mostrar: function(mostrar) {
			if (PE.RadSat.opciones.verRayos == mostrar) return;
			PE.RadSat.opciones.verRayos = mostrar;
			PE.RadSat.encabezado.actualizar();
			PE.RadSat.controles.actualizar();
			if (mostrar)
				this._obtener();
			else 
				this._eliminar();
		},
		
		_obtener: function() {
			if (!this._iniciado)
				this._iniciar();
			var bounds = PE.RadSat.mapa._mapa.getBounds();
			var that = this;
			if (bounds != null) {
				var ne = bounds.getNorthEast();
				var sw = bounds.getSouthWest();
				jQuery.ajax({
					url: "//www.pronosticoextendido.net/servicios/obtener-rayos.php?latMin=" + ne.lat + 
					"&lonMin=" + ne.lng + "&latMax=" + sw.lat + "&lonMax=" + sw.lng,
					dataType: 'xml',
					success: function(data){
						that._eliminar();
						that._marcas = new Array();
						that._tiempos = new Array();
						that._data = data;
						if (typeof(radsat_AlActualizarRayos) != "undefined") radsat_AlActualizarRayos(data);
						that._agregar(data);
					}
				});
			}
		},
		
		_eliminar: function() {
			if (this._marcas == null) return;
			for (var i = 0; i < this._marcas.length; i++)
				PE.RadSat.mapa._mapa.removeLayer(this._marcas[i]);
			this._marcas.length = 0;
			this._marcas = null;
			this._tiempos.length = 0;
			this._tiempos = null;
		},
		
		_actualizar: function() {
			if (!PE.RadSat.opciones.verRayos) return;
			if (PE.RadSat.animacion.esFuturo()) return;
			this._obtener();
		},
			
		_iniciar: function() {
			this._icono = L.icon({
				iconUrl: '//www.pronosticoextendido.net/recursos/imagenes/iconos/radsat/rayo.png',
				iconSize:   [22, 30],
				iconAnchor: [8, 0],
				popupAnchor:[8, 0]
			});
			this._iniciado = true;
		},
		
		_dibujarFrame: function() {
			if (this._marcas == null) return;
			var timeActual = PE.RadSat.animacion.frameActual * 10;
			for (var i = 0; i < this._marcas.length; i++) {
				var timeAgo = this._tiempos[i];
				this._marcas[i].setOpacity(1 - Math.max(0, Math.min(0.98, Math.abs((timeActual - timeAgo) / 15))));
			}
		}
		
	},
	
	pronostico: {

		tipo: 0,
		dia: "",
		
		_agregar: function(data) {
			if (!PE.RadSat.mapa._mapa.getPane("pronostico"))
				PE.RadSat.mapa._crearPane("pronostico", false, 660);
			var icono = jQuery(data).attr("icon");
			if (icono == "cw_no_report_icon") return;
			var desc = jQuery(data).attr("sky");
			var lat = jQuery(data).attr("latitude");
			var lng = jQuery(data).attr("longitude");
			var loc = jQuery(data).attr("location");
			var temps = "";
			var url = "";
			var w = 100;
			if (this.tipo != 0) {
				temps = "<span style='color: #24a'>" + Math.round(parseFloat(jQuery(data).attr("low_temp"))) + 
					"°</span> / <span style='color: #842'>" + Math.round(parseFloat(jQuery(data).attr("high_temp"))) + "°</span>";
				w = 120;
				url = "pronosticos/7-dias";
				if (PE.RadSat.opciones.idioma == "en") url = "https://www.extendedforecast.net/forecasts/7-day";
				if (PE.RadSat.opciones.idioma == "pt") url = "https://www.previsaoestendida.net/previsoes/7-dias";
			} else {
				temps = Math.round(parseFloat(jQuery(data).attr("temperature"))) + "°";
				url = "pronosticos/ahora";
				if (PE.RadSat.opciones.idioma == "en") url = "https://www.extendedforecast.net/forecasts/current";
				if (PE.RadSat.opciones.idioma == "pt") url = "https://www.previsaoestendida.net/previsoes/agora";
			}
			var divicon = L.divIcon({
				iconSize:   [w, 40],
				iconAnchor: [w / 2, 20],
				popupAnchor:[w / 2, 4],
				html: "<div class='radsat-loc'><div class='radsat-loc-datos'>" +
				"<img src='//www.pronosticoextendido.net/recursos/imagenes/pronostico/iconos/" + icono + ".png' alt='" + desc + 
				"' /><p class='radsat-loc-datos-temps' style='width: " + (w - 50).toString() + "px;'>" + temps + "</p>" +
				"<div class='clear'></div></div><p class='radsat-loc-nombre'>" + loc + "</p></div>"
			});
			var marker = L.marker(L.latLng(lat, lng), {
				title: desc,
				icon: divicon,
				pane: "pronostico"
			});
			this._marcas[this._marcas.length] = marker;
			marker.on("click", function (e) {
				if ((!PE.ubicacion) || (PE.ubicacion.pais.indexOf("Argentina") > -1))
					window.location = "//www.pronosticoextendido.net/" + url + "/" + loc.toLowerCase().replace(" ", "-") + "/";
				else
					window.location = "//www.pronosticoextendido.net/" + url + "/" + PE.ubicacion.pais.toLowerCase().replace(" ", "-") + "/" + loc.toLowerCase().replace(" ", "-") + "/";
			});
			marker.addTo(PE.RadSat.mapa._mapa);
		},
		
		mostrar: function(mostrar, tipo) {
			PE.RadSat.opciones.verPronostico = mostrar;
			this.tipo = tipo;
			PE.RadSat.mapa._agregarCapaEtiquetas();
			this._eliminar();
			if (mostrar)
				this._obtener();
		},
		
		_actualizar: function() {
			if (!PE.RadSat.opciones.verPronostico) return;
			this._obtener();
		},
		
		_obtener: function() {
			if (!this._iniciado)
				this._iniciar();
			var that = this;
			var pais = "Argentina";
			if (PE.ubicacion) pais = PE.ubicacion.pais;
			var tipo = "current_conditions";
			if (this.tipo != 0) tipo = "expanded_forecast";
			jQuery.ajax({
				url: '//www.pronosticoextendido.net/servicios/obtener-eltiempo-pais.aspx?pais=' + pais + '&tipo=' + tipo + 
				"&dia=" + this.tipo + "&z=" + PE.RadSat.mapa._mapa.getZoom(),
				dataType: 'xml',
				success: function(data) {
					that._eliminar();
					that._marcas = new Array();
					var actualizado = false;
					if (tipo == "current_conditions") {
						jQuery(data).find("observation").each(function() { 
							that._agregar(this);
							if (!actualizado) {
								that.dia = PE.RadSat.textos.ahora;
								PE.RadSat.encabezado.actualizar();
								actualizado = true;
							}
						});
					} else {
						jQuery(data).find("forecast").each(function() { 
							that._agregar(this);
							if (!actualizado) {
								fecha = new Date(jQuery(this).attr("iso8601"));
								if (PE.RadSat.opciones.idioma == "en")
									that.dia = jQuery(this).attr("weekday") + " " + (fecha.getMonth() + 1) + "-" + fecha.getDate();
								else
									that.dia = jQuery(this).attr("weekday") + " " + fecha.getDate() + "/" + (fecha.getMonth() + 1);
								PE.RadSat.encabezado.actualizar();
								actualizado = true;
							}
							
						});
					}
				}
			});
		},
		
		_eliminar: function() {
			if (this._marcas == null) return;
			for (var i = 0; i < this._marcas.length; i++)
				PE.RadSat.mapa._mapa.removeLayer(this._marcas[i]);
			this._marcas.length = 0;
			this._marcas = null;
			PE.RadSat.encabezado.actualizar();
		},
		
		_iniciar: function() {
			this._iniciado = true;
		}
			
	},
	
	radares: {
	
		marcas: new Array(),
		_urlBase: "//www.pronosticoextendido.net/api/datos/radares/nivel2/modo0/",
		_rutaBase: "actual",
		
		_iniciar: function() {
			this._lista = new Array();
			this._vistas = new Array();
			this._ids = new Array();
			this._agregarMosaico();
			if (PE.RadSat.opciones.modoPro)
				this._leerRadares();
		},
		
		_leerRadares: function() 
		{
			var that = this;
			if (this._lista.length > 1) return;
			jQuery.getJSON("//www.pronosticoextendido.net/servicios/obtener-radares.php", function(data) {
				for (var i = 0; i < data.length; i++) {
					that._lista[that._lista.length] = data[i];
					var ultimo = 0;
					if (i == data.length - 1)
						ultimo = 1;
					jQuery.getJSON('//www.pronosticoextendido.net/servicios/obtener-radares.php?id=' + data[i]['id'] + "&ultimo=" + ultimo,  function(dataV) { 
						for (var j = 0; j < that._lista.length; j++)
							if (that._lista[j]["id"] == dataV[0]["idRadar"]) {
									that._lista[j].vistas = dataV;
									break;
								}
						if ((dataV[0]["ultimo"] == "1") && (typeof radsat_AlLeerRadares == 'function')) setTimeout(function() { radsat_AlLeerRadares() }, 1000);
					});					
				}
			});
		},
		
		_buscarRadar: function(id) {
			for (var i = 0; i < this._lista.length; i++)
				if (this._lista[i]["id"] == id)
					return this._lista[i];
		},
		
		_buscarVista: function(id) {
			for (var i = 0; i < this._lista.length; i++)
				for (var j = 0; j < this._lista[i].vistas.length; j++)
					if (this._lista[i].vistas[j]["id"] == id)
						return this._lista[i].vistas[j];
		},
		
		_actualizarEstado: function() {
			PE.RadSat.opciones.verRadares = this._capa != null || (this._vistas != null && this._vistas.length > 0);
			PE.RadSat.encabezado.actualizar();
			PE.RadSat.encabezado.actualizarTiposRadares(PE.RadSat.opciones.verRadares);
			PE.RadSat.controles.actualizar();
		},

		_obtenerRuta: function(vista) {
			return this._urlBase + this._rutaBase + "/" + vista["ruta"] + "/" + 
			PE.RadSat.animacion.frameActual + ".png?r=" + PE.RadSat._random;
		},
		
		ocultarRadar: function(id) {
			for (var i = this._ids.length - 1; i >= 0; i--)
				if (this._buscarVista(this._ids[i])["idRadar"] == id) {
					PE.RadSat.mapa._mapa.removeLayer(this._vistas[i]);
					this._ids.splice(i, 1);
					this._vistas.splice(i, 1);
				}
			this._actualizarEstado();
	   },
		
		ocultarVistas: function() {
			for (var i = this._ids.length - 1; i >= 0; i--) {
				PE.RadSat.mapa._mapa.removeLayer(this._vistas[i]);
				this._ids.splice(i, 1);
				this._vistas.splice(i, 1);
			}
			this.mostrarVista(0, false);
			this._actualizarEstado();
	   },
		
		mostrarVista: function(id, mostrar) {
			if ((id == 0) && (PE.RadSat.opciones.usarRadarCapaMosaico)) {
				if (mostrar) {
					if (!PE.RadSat.mapa._mapa.getPane("radar"))
						PE.RadSat.mapa._crearPane("radar", true, 230);
					if (this._capa == null) this._capa = this._agregarCapaMosaico("radar", 1);
					this._capa.addTo(PE.RadSat.mapa._mapa);
				} else {
					if (this._capa != null) PE.RadSat.mapa._mapa.removeLayer(this._capa);
					this._capa = null;
				}
			} else {
				if (mostrar) {
					if (!PE.RadSat.mapa._mapa.getPane("radar"))
						PE.RadSat.mapa._crearPane("radar", true, 230);
					vista = this._buscarVista(id);
					this.ocultarRadar(vista["idRadar"]);
					llb = L.latLngBounds(L.latLng(vista["ltMin"], vista["lgMin"]), 
					L.latLng(vista["ltMax"], vista["lgMax"]));
					vista = L.imageOverlay(this._obtenerRuta(vista), llb, {pane: "radar"});
					if ((PE.RadSat.opciones.modoMovil) && (PE.RadSat.opciones.integrarEtiquetas)) vista.setOpacity(0.8);
					vista.addTo(PE.RadSat.mapa._mapa);
					this._vistas[this._vistas.length] = vista;
					this._ids[this._ids.length] = id;
				} else {
					for (var i = this._ids.length - 1; i >= 0; i--)
						if (this._ids[i] == id) {
							PE.RadSat.mapa._mapa.removeLayer(this._vistas[i]);
							this._ids.splice(i, 1);
							this._vistas.splice(i, 1);
							return;
						}
				}
			}
			this._actualizarEstado();
	    },
		
		verPasado: function(fecha) {
			this._rutaBase = "pasado/" + fecha.replace(new RegExp('/', 'g'), '-');
		},
	   
	    verActual: function() {
			this._rutaBase = "actual";
		},
	   
	    vistaVisible: function(id) {
			if ((id == 0) && (PE.RadSat.opciones.usarRadarCapaMosaico) && (this._capa != null)) return true;
			for (var i = this._ids.length - 1; i >= 0; i--)
				if (this._ids[i] == id) return true;
			return false;
 	    },
	   
	    _agregarMosaico: function() {
			radar = new Object();
			radar["id"] = "0";
			radar["nombre"] = "Mosaico";
			radar["vistas"] = new Array();
			radar["vistas"][0] = new Object();
			radar["vistas"][0]["id"] = "0";
			radar["vistas"][0]["idProceso"] = "1";
			radar["vistas"][0]["ltMax"] = "-57";
			radar["vistas"][0]["lgMax"] = "-80";
			radar["vistas"][0]["ltMin"] = "12";
			radar["vistas"][0]["lgMin"] = "-28";
			radar["vistas"][0]["ruta"] = "mosaico";
			this._lista[this._lista.length] = radar;
		},
		
		_agregarCapaMosaico: function(pane, zIndex) {
			capa = new L.GridLayer.RadarMosaico({
				tms: true,
				minZoom: 4,
				maxZoom: 20,
				maxNativeZoom: 8,
				errorTileUrl: "//www.pronosticoextendido.net/api/datos/tiles/blank.png",
				zIndex: zIndex,
				pane: pane,
				detectRetina: PE.RadSat.opciones.detectarRetina
			});
			return capa;
		},
		
		usarCapaMosaico: function(usar) {
			mosaicoVisible = this.vistaVisible(0);
			if (mosaicoVisible) this.mostrarVista(0, false);
			PE.RadSat.opciones.usarRadarCapaMosaico = usar;
			if (mosaicoVisible) this.mostrarVista(0, true);
		},
		   
		_cargarImagen: function(img) {
			return function(){
				img.onload = null;
				img = null;
			};
		},
		
		_dibujarFrame: function() {
			if (!PE.RadSat.opciones.verRadares) return;
			if (this._lista == null) this._iniciar();
			for (var i = 0; i < this._vistas.length; i++) {
				vista = this._buscarVista(this._ids[i]);
				if (PE.RadSat.animacion.frameActual < 0) 
					this._vistas[i].setUrl("");
				else {
					var img = document.createElement('img');
					img.src = this._obtenerRuta(vista);
					img.onload = this._cargarImagen(img);
					img.onerror = this._cargarImagen(img);
					this._vistas[i].setUrl(img.src);
				}
			}
			if (this._capa != null) this._capa._dibujarFrame();
		}
		
	},
	

	satelite: {
		
		_urlBase: "//www.pronosticoextendido.net/api/datos/satelites/",
				
		_agregarCapa: function(tipo) {
			if (!PE.RadSat.mapa._mapa.getPane("satelite"))
				PE.RadSat.mapa._crearPane("satelite", true, 220);
			capa = new L.GridLayer.WeatherAPI({
				tms: true,
				minZoom: 2,
				zIndex: 0,
				pane: "satelite",
				detectRetina: PE.RadSat.opciones.detectarRetina, 
				attribution: '<a href="http://weather.com" target="_blank">The Weather Channel</a>'
			});
			capa.tipo = tipo;
			capa.tipoFuturo = "cloudsFcst";
			capa.addTo(PE.RadSat.mapa._mapa);
			return capa;
		},
		
		_agregarCapaWU: function(tipo, pane, zIndex) {
			if (!PE.RadSat.mapa._mapa.getPane("satelite"))
				PE.RadSat.mapa._crearPane("satelite", true, 220);
			capaIR = new L.GridLayer.SateliteWU({
				tms: true,
				minZoom: 2,
				zIndex: zIndex,
				pane: pane,
				detectRetina: PE.RadSat.opciones.detectarRetina, 
				attribution: '<a href="http://weather.com" target="_blank">The Weather Channel</a>'
			});
			capaIR.url = "//wublast.wunderground.com/cgi-bin/WUBLAST?width=256&height=256&gtt=120&num=1&delay=0&key=" + tipo + "&proj=me&rand=24934649&timelabel=0&timelabel.x=1000&timelabel.y=0&cors=1";
			capaIR.addTo(PE.RadSat.mapa._mapa);
			return capaIR;
		},		
		
		_agregarCapaRealEarth: function(tipo) {
			if (!PE.RadSat.mapa._mapa.getPane("satelite"))
				PE.RadSat.mapa._crearPane("satelite", true, 220);
			capa = new L.GridLayer.WeatherAPI({
				tms: true,
				minZoom: 2,
				zIndex: 0,
				pane: "satelite",
				detectRetina: PE.RadSat.opciones.detectarRetina, 
				attribution: '<a href="http://http://realearth.ssec.wisc.edu" target="_blank">RealEarth</a>'
			});
			capa.tipo = tipo;
			capa.realEarth = true;
			capa.tipoFuturo = "cloudsFcst";
			capa.addTo(PE.RadSat.mapa._mapa);
			return capa;
		},
		
		_obtener: function() {
			if (this._capa != null) PE.RadSat.mapa._mapa.removeLayer(this._capa);
			this._capa = null;
			if (PE.RadSat.opciones.tipoSatelite == 1) {
				PE.RadSat.encabezado._titulo.actualizarTiposEventos(7, true, "satelite");
				//this._capa = this._agregarCapaWU("sat_vis", "satelite", 0);
				this._capa = this._agregarCapa("sat");
			} 
			if (PE.RadSat.opciones.tipoSatelite == 2) {
				PE.RadSat.encabezado._titulo.actualizarTiposEventos(7, true, "satir");
//				this._capa = this._agregarCapa("thermalSat");
				this._capa = this._agregarCapaWU("sat_ir4", "satelite", 0);
			}
			if (PE.RadSat.opciones.tipoSatelite == 3) {
				PE.RadSat.encabezado._titulo.actualizarTiposEventos(7, true, "satir");
				this._capa = this._agregarCapa("satgoes16FullDiskIR");
			}
			if (PE.RadSat.opciones.tipoSatelite == 4) {
				PE.RadSat.encabezado._titulo.actualizarTiposEventos(7, true, "satelite");
				this._capa = this._agregarCapa("satgoes16FullDiskVis");
			}
			if (PE.RadSat.opciones.tipoSatelite == 5) {
				PE.RadSat.encabezado._titulo.actualizarTiposEventos(7, true, "satelite");
				this._capa = this._agregarCapaRealEarth("G16-ABI-FD-TC");
			}
			if (this._capa != null) this._capa.addTo(PE.RadSat.mapa._mapa);
		},
		
		mostrarTipo: function(tipo) {
			PE.RadSat.opciones.tipoSatelite = tipo;
			PE.RadSat.mapa._agregarCapaEtiquetas();
			if (PE.RadSat.opciones.verSatelite) this._obtener();
		},
		
		mostrar: function(mostrar) {
			if (PE.RadSat.opciones.verSatelite == mostrar) return;
			PE.RadSat.opciones.verSatelite = mostrar;
			PE.RadSat.encabezado.actualizar();
			PE.RadSat.controles.actualizar();
			PE.RadSat.mapa._agregarCapaEtiquetas();
			if (mostrar) 
				this._obtener();
			else {
				if (this._capa != null) {
					PE.RadSat.mapa._mapa.removeLayer(this._capa);
					this._capa = null;
				}
				PE.RadSat.encabezado._titulo.actualizarTiposEventos(7, false);
			}
		},
		
		_cargarImagen: function(img) {
			return function(){
				img.onload = null;
				img = null;
			};
		},
				
		_dibujarFrame: function() {
			if (!PE.RadSat.opciones.verSatelite) return;
			if (this._capa != null) this._capa._dibujarFrame();
		}
		
	},
	
	capasDatos: {
	
		capaVisible: function(capa) {
			if (this._capas != null) 
				for (var i = 0; i < this._capas.length; i++)
					if ((this._capas[i].tipo == capa) &&  (this._capas[i]._map == PE.RadSat.mapa._mapa))
						return true;
			return false;
		},
		
		algunaCapaVisible: function() {
			if (this._capas != null) 
				for (var i = 0; i < this._capas.length; i++)
					if (this._capas[i]._map == PE.RadSat.mapa._mapa)
						return true;
			return false;
		},
		
		mostrar: function(capa, mostrar) {
			if (mostrar) {
				if ((this._capas == null) || (this._capas[capa] == null)) {
					if (!PE.RadSat.mapa._mapa.getPane("superposiciones"))
						PE.RadSat.mapa._crearPane("superposiciones", false, 205);
					if (this._capas == null)
						this._capas = new Array();
					this._capas[this._capas.length] = new L.GridLayer.WeatherAPI({
						tms: true,
						minZoom: 2,
						zIndex: 0,
						pane: "superposiciones",
						detectRetina: PE.RadSat.opciones.detectarRetina, 
						attribution: '<a href="http://weather.com" target="_blank">The Weather Channel</a>'
					});
					this._capas[this._capas.length-1].tipo = capa;
					this._capas[this._capas.length-1].tipoFuturo = capa + "Fcst";
					if (capa == "precip24hr") this._capas[this._capas.length-1].factorFuturo = 2;
					if (capa == "precip24hr") this._capas[this._capas.length-1].offsetFuturo = -1;
				}
				this._capas[this._capas.length-1].addTo(PE.RadSat.mapa._mapa);
				PE.RadSat.encabezado.actualizar();
				PE.RadSat.encabezado._titulo.actualizarTiposEventos(8, true, capa);
				PE.RadSat.controles.actualizar();
			} else {
				if (this._capas != null) {
					for (var i = 0; i < this._capas.length; i++)
						if (this._capas[i].tipo == capa)
							PE.RadSat.mapa._mapa.removeLayer(this._capas[i]);
				}
				PE.RadSat.encabezado.actualizar();
				PE.RadSat.encabezado._titulo.actualizarTiposEventos(8, false);
				PE.RadSat.controles.actualizar();
			}
		},
		
		_dibujarFrame: function() {
			if (this._capas == null) return;
			for (var i = 0; i < this._capas.length; i++)
				this._capas[i]._dibujarFrame();
		}
	
	},
	
	
	sismos: {
		
		_agregar: function(data) {
			var fecha = jQuery(data).find("pubDate").text();
			var detalle = jQuery(data).find("description").text();
			c = jQuery(data).find("gml\\:pos").text().split(" ");
			var lat = c[0];
			var lng = c[1];
			var marker = L.marker(L.latLng(lat, lng), {
				title: "Sismo",
				icon: this._icono,
			});
			this._marcas[this._marcas.length] = marker;
			marker.on("click", function (e) {
				PE.RadSat._popup.setLatLng(e.latlng);
				PE.RadSat._popup.setContent('<div class="radsat-popup-titulo"><b>Sismo registrado</b><br />' + fecha + "</div>" +
				'<div class="radsat-popup-contenido">' + PE.RadSat.textos.cargando + '</div>');
				PE.RadSat._popup.openOn(PE.RadSat.mapa._mapa);
				var txt = fecha;
				var txt2 = detalle;
				jQuery.getJSON('//www.pronosticoextendido.net/servicios/obtener-contenido.php?tipo=6&lat=' + lat + '&lng=' + lng, function(data) { 
					PE.RadSat._popup.setContent('<div class="radsat-popup-titulo"><b>Sismo registrado</b><br />' + txt + "</div>" +
					'<div class="radsat-popup-contenido">' + data[0].contenido + '<br /><b>Detalle:</b> ' + txt2 + '</div>');
				});
			});
			marker.addTo(PE.RadSat.mapa._mapa);
		},
		
		mostrar: function(mostrar) {
			if (PE.RadSat.opciones.verSismos == mostrar) return;
			PE.RadSat.opciones.verSismos = mostrar;
			PE.RadSat.encabezado.actualizar();
			if (mostrar)
				this._obtener();
			else 
				this._eliminar();
		},
		
		_obtener: function() {
			if (!this._iniciado)
				this._iniciar();
			var that = this;
			jQuery.ajax({
				url: '//www.pronosticoextendido.net/servicios/obtener-sismos.php?tipo=3',
				dataType: 'xml',
				success: function(data) {
					that._marcas = new Array();
					var xml = jQuery('channel', data);
					jQuery(xml).find("item").each(function() { that._agregar(this) });
				}
			});
		},
		
		_eliminar: function() {
			if (this._marcas == null) return;
			for (var i = 0; i < this._marcas.length; i++)
				PE.RadSat.mapa._mapa.removeLayer(this._marcas[i]);
			this._marcas.length = 0;
			this._marcas = null;
		},
		
		_iniciar: function() {
			this._icono = L.icon({
				iconUrl: '//www.pronosticoextendido.net/recursos/imagenes/iconos/radsat/sismo.png',
				iconSize:   [30, 30],
				iconAnchor: [15, 15],
				popupAnchor:[15, 5]
			});
			this._iniciado = true;
		}
		
	},
	
	reportes: {
		
		_agregar: function(data) {
			var row = data["row"].replace("\"","").replace(")","").replace("(","").replace('"',"").split(",");
			var lat = row[1];
			var lng = row[2];
			var tipo = row[3];
			var rango = row[4];
			var hora = new Date(row[0].slice(0, 19).replace(/-/g,'/'));
			var imagenURL = "";
			switch (tipo) 
			{
				case "tornado": imagenURL = "//chart.apis.google.com/chart?chst=d_bubble_text_small_withshadow&chld=bbT|T|FF4400|FFFFFF"; break;
				case "granizo":
					switch (rango) 
					{
						case "1": imagenURL = "//chart.apis.google.com/chart?chst=d_bubble_text_small_withshadow&chld=bbT|G1|EEEEFF|000000"; break;
						case "2": imagenURL = "//chart.apis.google.com/chart?chst=d_bubble_text_small_withshadow&chld=bbT|G2|CCDDFF|000000"; break;
						case "3": imagenURL = "//chart.apis.google.com/chart?chst=d_bubble_text_small_withshadow&chld=bbT|G3|AACCFF|000000"; break;
						case "4": imagenURL = "//chart.apis.google.com/chart?chst=d_bubble_text_small_withshadow&chld=bbT|G4|88AAFF|000000"; break;
					} break;
				case "dpv":
					switch (rango) 
					{
						case "1": imagenURL = "//chart.apis.google.com/chart?chst=d_bubble_text_small_withshadow&chld=bbT|V1|FFFFCC|000000"; break;
						case "2": imagenURL = "//chart.apis.google.com/chart?chst=d_bubble_text_small_withshadow&chld=bbT|V2|FFFFAA|000000"; break;
						case "3": imagenURL = "//chart.apis.google.com/chart?chst=d_bubble_text_small_withshadow&chld=bbT|V3|FFFF88|000000"; break;
					} break;
				case "inundacion":
					switch (rango) 
					{
						case "1": imagenURL = "//chart.apis.google.com/chart?chst=d_bubble_text_small_withshadow&chld=bbT|I1|9999FF|FFFFFF"; break;
						case "2": imagenURL = "//chart.apis.google.com/chart?chst=d_bubble_text_small_withshadow&chld=bbT|I2|7777FF|FFFFFF"; break;
						case "3": imagenURL = "//chart.apis.google.com/chart?chst=d_bubble_text_small_withshadow&chld=bbT|I3|4444FF|FFFFFF"; break;
						case "4": imagenURL = "//chart.apis.google.com/chart?chst=d_bubble_text_small_withshadow&chld=bbT|I4|1111FF|FFFFFF"; break;
					} break;
			}
			if (imagenURL != "") {
				var marker = L.marker(L.latLng(lat, lng), {
					title: "Reporte de " + tipo,
					icon: L.icon({iconUrl: imagenURL, iconSize: [59, 31], iconAnchor: [29, 15], popupAnchor:[29, 5]}),
				});
				this._marcas[this._marcas.length] = marker;
				marker.on("click", function (e) {
					PE.RadSat._popup.setLatLng(e.latlng);
					PE.RadSat._popup.setContent('<div class="radsat-popup-titulo"><b>Reporte enviado</b><br />Tipo: ' + tipo + "</div>" +
					'<div class="radsat-popup-contenido"><b>Rango</b>: ' + rango + '<br /><b>Hora</b>: ' + hora + '</div>');
					PE.RadSat._popup.openOn(PE.RadSat.mapa._mapa);
				});
				marker.addTo(PE.RadSat.mapa._mapa);
			}
		},
		
		mostrar: function(mostrar) {
			if (PE.RadSat.opciones.verReportes == mostrar) return;
			PE.RadSat.opciones.verReportes = mostrar;
			PE.RadSat.encabezado.actualizar();
			if (mostrar)
				this._obtener();
			else 
				this._eliminar();
		},
		
		_obtener: function() {
			var that = this;
			jQuery.getJSON('//www.pronosticoextendido.net/servicios/obtener-alertamos.php?dias=1', function(data) {
				that._marcas = new Array();
				data = JSON.parse(data["resultado"]);
				for (i = 0; i < data.length; i++)
					that._agregar(data[i]);
			});
		},
		
		_eliminar: function() {
			if (this._marcas == null) return;
			for (var i = 0; i < this._marcas.length; i++)
				PE.RadSat.mapa._mapa.removeLayer(this._marcas[i]);
			this._marcas.length = 0;
			this._marcas = null;
		},
		
	},
	
	dibujos: {
		lista: new Array()
	},
	
	simbolos: {
		lista: new Array()
	},
	
	encabezado: {
		
		_iniciar: function() {
			if (this._titulo != null) return;
			this._titulo = new L.Control.Titulo();
			PE.RadSat.mapa._mapa.addControl(this._titulo);
			this._cruz = document.createElement('div');
			this._cruz.className = "radsat-cruz";
			this._cruz.innerHTML = "+";
			if (!PE.RadSat.opciones.verCruz) 
				this._cruz.style.display = "none";
			var contenedor = document.getElementById(PE.RadSat._contenedor);
			contenedor.parentElement.appendChild(this._cruz);
		},
		
		mostrarCruz: function(mostrar) {
			PE.RadSat.opciones.verCruz = mostrar;
			if (mostrar)
				this._cruz.style.display = "";
			else
				this._cruz.style.display = "none";
		},
		
		actualizar: function() {
			if (!PE.RadSat.opciones.verEncabezado) return;
			if (this._div_titulo == null) this._iniciar();
			if (PE.RadSat.opciones.titulo != "") {
				this._titulo.titulo(PE.RadSat.opciones.titulo);
				this._titulo.rango(PE.RadSat.opciones.rango);
				this._titulo.estilo("radar");
				return;
			}
			if (PE.RadSat.capasDatos.capaVisible("temp")) {
				this._titulo.estilo("alertas");
				this._titulo.titulo(PE.RadSat.textos.temperaturas);
			} else
			if (PE.RadSat.capasDatos.capaVisible("feelsLike")) {
				this._titulo.estilo("alertas");
				this._titulo.titulo(PE.RadSat.textos.sensacionTermica);
			} else
			if (PE.RadSat.capasDatos.capaVisible("uv")) {
				this._titulo.estilo("alertas");
				this._titulo.titulo(PE.RadSat.textos.indiceUV);
			} else
			if (PE.RadSat.capasDatos.capaVisible("dewpoint")) {
				this._titulo.estilo("sismos");
				this._titulo.titulo(PE.RadSat.textos.rocio);
			} else
			if (PE.RadSat.capasDatos.capaVisible("windSpeed")) {
				this._titulo.estilo("reportes");
				this._titulo.titulo(PE.RadSat.textos.vientos);
			} else
			if (PE.RadSat.capasDatos.capaVisible("precip24hr")) {
				this._titulo.estilo("reportes");
				this._titulo.titulo(PE.RadSat.textos.lluviasEstimadas);
			} else
			if (PE.RadSat.opciones.verPronostico) {
				this._titulo.estilo("alertas");
				if (PE.RadSat.pronostico.tipo == 0)  {
					this._titulo.titulo(PE.RadSat.textos.datosactuales);
					this._titulo.rango(PE.RadSat.textos.ahora);
				}
				else {
					this._titulo.titulo(PE.RadSat.textos.pronostico);
					this._titulo.rango(PE.RadSat.pronostico.dia);
				}
			} else
			if (PE.RadSat.opciones.verAlertas) {
				this._titulo.estilo("alertas");
				if (PE.RadSat.opciones.verAvisos) 
					this._titulo.titulo(PE.RadSat.textos.alertas + " " + PE.RadSat.textos.y + " " + PE.RadSat.textos.avisos);
				else
					this._titulo.titulo(PE.RadSat.textos.alertas);
			} else
			if (PE.RadSat.opciones.verRadares) {
				this._titulo.estilo("radar");
				if (PE.RadSat.animacion.frameActual < 0) {
					if (PE.RadSat.opciones.idioma == "en") {
						if (PE.RadSat.opciones.verSatelite) 
							this._titulo.titulo(PE.RadSat.textos.futuro + " " + PE.RadSat.textos.radar + " " + PE.RadSat.textos.y + " " + PE.RadSat.textos.satelite);
						else
							this._titulo.titulo(PE.RadSat.textos.futuro + " " + PE.RadSat.textos.radar);
					} else {
						if (PE.RadSat.opciones.verSatelite) 
							this._titulo.titulo(PE.RadSat.textos.radar + " " + PE.RadSat.textos.y + " " + PE.RadSat.textos.satelite + " " + PE.RadSat.textos.futuro);
						else
							this._titulo.titulo(PE.RadSat.textos.radar + " " + PE.RadSat.textos.futuro);
					}
				}
				else 
					if (PE.RadSat.opciones.verSatelite) {
						if (PE.RadSat.opciones.tipoSatelite > 2)
							this._titulo.titulo(PE.RadSat.textos.radar + " " + PE.RadSat.textos.y + " " + PE.RadSat.textos.sateliteGOES);
						else
							this._titulo.titulo(PE.RadSat.textos.radar + " " + PE.RadSat.textos.y + " " + PE.RadSat.textos.satelite);
					}
					else
						if (PE.RadSat.opciones.verRayos)
							this._titulo.titulo(PE.RadSat.textos.radar + " " + PE.RadSat.textos.y + " " + PE.RadSat.textos.rayos);
						else
							if (PE.RadSat.opciones.verAvisos)
								this._titulo.titulo(PE.RadSat.textos.radar + " " + PE.RadSat.textos.y + " " + PE.RadSat.textos.avisos);
							else
								this._titulo.titulo(PE.RadSat.textos.radar);
			} else
			if (PE.RadSat.opciones.verSatelite) {
				this._titulo.estilo("radar");
				if (PE.RadSat.animacion.frameActual < 0) {
					if (PE.Radsat.opciones.idioma == "en")
						this._titulo.titulo(PE.RadSat.textos.satelite + " " + PE.RadSat.textos.futuro);
					else
						this._titulo.titulo(PE.RadSat.textos.futuro + " " + PE.RadSat.textos.satelite);
				} else {
					if (PE.RadSat.opciones.tipoSatelite > 2) {
						if (PE.RadSat.opciones.verRayos)
							this._titulo.titulo(PE.RadSat.textos.sateliteGOES + " " + PE.RadSat.textos.y + " " + PE.RadSat.textos.rayos);
						else
							this._titulo.titulo(PE.RadSat.textos.sateliteGOES);
					}
					else {
						if (PE.RadSat.opciones.verRayos)
							this._titulo.titulo(PE.RadSat.textos.satelite + " " + PE.RadSat.textos.y + " " + PE.RadSat.textos.rayos);
						else
							this._titulo.titulo(PE.RadSat.textos.satelite);
					}
				}
			} else
			if (PE.RadSat.opciones.verRayos) {
				this._titulo.estilo("radar");
				this._titulo.titulo(PE.RadSat.textos.rayos);
			} else
			if (PE.RadSat.opciones.verAvisos) {
				this._titulo.estilo("alertas");
				this._titulo.titulo(PE.RadSat.textos.avisos);
			} else
			if (PE.RadSat.opciones.verReportes) {
				this._titulo.estilo("reportes");
				this._titulo.titulo(PE.RadSat.textos.reportes);
			} else
			if (PE.RadSat.opciones.verSismos) {
				this._titulo.estilo("sismos");
				this._titulo.titulo(PE.RadSat.textos.sismos);
			} else {
				this._titulo.estilo("radar");
				this._titulo.titulo(PE.RadSat.textos.radsat);
			}
		},
		
		
		_ventanaCambiada: function() {
			if (!PE.RadSat.opciones.verEncabezado) return;
			if (this._div_titulo == null) this._iniciar();
			this._titulo._ventanaCambiada();
		},		
		
		actualizarTiposAlertas: function(mostrar) {
			this._titulo.actualizarTiposEventos(6, mostrar);
		},
		
		actualizarTiposAvisos: function(mostrar) {
			this._titulo.actualizarTiposEventos(2, mostrar);
		},
		
		actualizarTiposRadares: function(mostrar) {
			this._titulo.actualizarTiposEventos(5, mostrar);
		},
		
		_dibujarFrame: function() {
			if (!PE.RadSat.opciones.verEncabezado) return;
			if (PE.RadSat.opciones.verPronostico) return;
			if (this._titulo == null) _iniciar();
			if (PE.RadSat.opciones.verRadares || PE.RadSat.opciones.verSatelite || PE.RadSat.opciones.verRayos || PE.RadSat.capasDatos.algunaCapaVisible()) {
				this.actualizar();
				if ((PE.RadSat.capasDatos.capaVisible("precip24hr")) && (PE.RadSat.animacion.frameActual < 0)) {
					if (PE.RadSat.animacion.frameActual == -1)
						this._titulo.rango(PE.RadSat.textos.manana);
					else {
						var d = new Date();
						d.setDate(d.getDate() - PE.RadSat.animacion.frameActual);
						this._titulo.rango(d.toLocaleString(PE.RadSat.opciones.idioma, { weekday: 'long' }));
					}
				} else {
					var ff = new Date(PE.RadSat._fechaBase);
					if (PE.RadSat.animacion.frameActual < 0) {
						ff.setHours(PE.RadSat._fechaBase.getHours() + (0 - PE.RadSat.animacion.frameActual));
						ff.setMinutes(0);
					}
					else
						ff.setMinutes(Math.floor((Math.floor((PE.RadSat._fechaBase.getMinutes() - 5) / 10) * 10 - (PE.RadSat.animacion.frameActual * 10)) / 10) * 10);
					this._titulo.rango(ff.formatHM());
				}
			} else if (PE.RadSat.opciones.verSismos)
				this._titulo.rango("30 " + PE.RadSat.textos.dias);
				else 
					if (PE.RadSat.capasDatos.capaVisible("precip24hr"))
						this._titulo.rango(PE.RadSat.textos.ultimas + " 24 " + PE.RadSat.textos.horas);
					else
						this._titulo.rango(PE.RadSat.textos.ahora);
		}
		
	},
	
	controles: {
	
		_iniciar: function() {
			var contenedor = document.getElementById(PE.RadSat._contenedor);
			if (this._div_play == null) {
				this._div_play = document.createElement('div');
				this._div_play.id = 'radsat-play';
				this._div_play.addEventListener("click", function(){ PE.RadSat.animacion.invertirReproduccion(); }, false); 
				this._actualizarBotonPlay();
				contenedor.parentElement.appendChild(this._div_play);
			}
			if (this._div_frame == null) {
				this._div_frame = document.createElement('input');
				this._div_frame.type = 'range';
				this._div_frame.min = '0';
				this._div_frame.max = (PE.RadSat.animacion.frames - 1).toString();
				this._div_frame.value = PE.RadSat.animacion.frameActual.toString();
				this._div_frame.id = 'radsat-frame';
				jQuery(this._div_frame).on("input change", function() {
					if (PE.RadSat.animacion.esFuturo()) 
						PE.RadSat.animacion.verFrame(-this.value - 1); 
					else
						PE.RadSat.animacion.verFrame(PE.RadSat.animacion.frames - this.value - 1); 
				}); 
				jQuery(this._div_frame).on("mousedown", function() {
					if (PE.RadSat.animacion.reproduciendo) {
						PE.RadSat.animacion._reproduciendo_antes = true; 
						PE.RadSat.animacion.pausar(); 
					}
				}); 
				jQuery(this._div_frame).on("mouseup", function() {
					if (!PE.RadSat.animacion.reproduciendo) {
						if (PE.RadSat.animacion._reproduciendo_antes) {
							PE.RadSat.animacion._reproduciendo_antes = null;
							PE.RadSat.animacion.reproducir(); 
						}
					}
				}); 
				this._actualizarControlFrame();
				contenedor.parentElement.appendChild(this._div_frame);
			}
			if (this._div_futuro == null) {
				this._div_futuro = document.createElement('div');
				this._div_futuro.id = 'radsat-futuro';
				this._div_futuro.addEventListener("click", function(){ PE.RadSat.animacion.invertirFuturo(); }, false); 
				this._actualizarBotonFuturo();
				contenedor.parentElement.appendChild(this._div_futuro);
			}
		},
		
		_actualizarBotonPlay: function() {
			if (PE.RadSat.animacion.reproduciendo) {	
				this._div_play.className = '';
				this._div_play.title = 'Pausar';
			} else {
				this._div_play.className = 'radsat-pausa';
				this._div_play.title = 'Reproducir';
			}
		},
		
		_actualizarBotonFuturo: function() {
			if (!PE.RadSat.animacion.esFuturo()) {	
				this._div_futuro.className = '';
				this._div_futuro.title = 'Ver futuro';
			} else {
				this._div_futuro.className = 'radsat-pasado';
				this._div_futuro.title = 'Ver pasado';
			}
		},
		
		_actualizarControlFrame: function() {
			if (PE.RadSat.animacion.esFuturo()) 
				this._div_frame.value = (-PE.RadSat.animacion.frameActual - 1).toString();
			else
				this._div_frame.value = (PE.RadSat.animacion.frames - PE.RadSat.animacion.frameActual - 1).toString();
		},
		
		actualizar: function() {
			if (this._div_play == null) this._iniciar();
			mostrar = (PE.RadSat.opciones.verReproduccion) && (
				(PE.RadSat.opciones.verRadares) || (PE.RadSat.opciones.verSatelite) || 
				(PE.RadSat.opciones.verRayos) || (PE.RadSat.capasDatos.algunaCapaVisible()));
			if (mostrar) {
				this._actualizarBotonPlay();
				this._actualizarBotonFuturo();
				jQuery(this._div_play).fadeIn(200);
				jQuery(this._div_frame).fadeIn(200);
				if ((PE.RadSat.opciones.verRadares) || (PE.RadSat.opciones.verSatelite) || (PE.RadSat.capasDatos.algunaCapaVisible()))
					jQuery(this._div_futuro).delay(100).fadeIn(200);
			}
			else {
				jQuery(this._div_play).fadeOut(200);
				jQuery(this._div_frame).fadeOut(200);
				jQuery(this._div_futuro).delay(100).fadeOut(200);
			}
			if (typeof radsat_AlActualizarControles == 'function') radsat_AlActualizarControles(mostrar);
		},
		
		_dibujarFrame: function() {
			if (this._div_frame == null) this._iniciar();
			this._actualizarControlFrame();
		},
		
		_ventanaCambiada: function() {
		},
		
		_framesCambiados: function() {
			if (this._div_frame != null) {
				this._div_frame.max = (PE.RadSat.animacion.frames - 1).toString();
				this._actualizarControlFrame();
			}
		},
				
		
		desactivarReproduccion: function() {
			jQuery(this._div_play).hide();
			jQuery(this._div_frame).hide();
			jQuery(this._div_futuro).hide();
			PE.RadSat.opciones.verReproduccion = false;
		},
		
		desactivarZoom: function() {
			PE.RadSat.mapa._mapa.removeControl(PE.RadSat.mapa._mapa.zoomControl);
			PE.RadSat.opciones.verZoom = false;
		}

	},
	
	animacion: {
		
		reproduciendo: false,
		
		frameActual: 1,
		frameHasta: 0,
		frames: 6,
		intervalo: 600,
		
		verFrames: function(frames) {
			this.frames = frames;
			if (this.esFuturo())
				this.frameHasta = -frames;
			else
				this.frameHasta = 0;
			if (PE.RadSat.controles != null) PE.RadSat.controles._framesCambiados();
		},
		
		pausar: function() {
			this.reproduciendo = false;
			PE.RadSat.controles.actualizar();
		},
		
		detener: function() {
			this.pausar();
			PE.RadSat.controles.actualizar();
			this.frameActual = 0;
		},
		
		reproducir: function() {
			this.reproduciendo = true;
			PE.RadSat.controles.actualizar();
			this._dibujarFrame();
		},
		
		invertirReproduccion: function() {
			if (this.reproduciendo)
				this.pausar();
			else
				this.reproducir();
		},
		
		invertirFuturo: function() {
			if (!this.esFuturo()) {
				if (this.frameHasta >= 0)
					this.frameHasta = -this.frames;
			} else {
				if (this.frameHasta < 0)
					this.frameHasta = 0;
			}
			if (this.frameActual >= 0)
				this.verFrame(-1);
			else
				this.verFrame(0);
			PE.RadSat.controles.actualizar();
		},
		
		esFuturo: function() {
			return this.frameActual < 0;
		},
		
		mostrarFuturo: function(mostrar) {
			if (mostrar) {
				if (this.frameHasta >= 0)
					this.frameHasta = -this.frames;
			} else {
				if (this.frameHasta < 0)
					this.frameHasta = 0;
			}
			this.frameActual = this.frameHasta;
			this._dibujarFrame();
			PE.RadSat.controles.actualizar();
		},
		
		_actualizarFrame: function() {
			PE.RadSat.radares._dibujarFrame();
			PE.RadSat.satelite._dibujarFrame();
			PE.RadSat.rayos._dibujarFrame();
			PE.RadSat.encabezado._dibujarFrame();
			PE.RadSat.controles._dibujarFrame();
			PE.RadSat.capasDatos._dibujarFrame();
		},
		
		_dibujarFrame: function() {
			if (!this.reproduciendo) return;
			this._reloj = clearTimeout(this._reloj);
			this._avanzarFrame();
			this._actualizarFrame();
			this._reloj = setTimeout("PE.RadSat.animacion._dibujarFrame()", this.intervalo * this._producto);
		},
		
		_avanzarFrame: function() {
			this.frameActual--;
			this._limitarFrame();
		},
		
		verFrame: function(frame) {
			this.frameActual = frame;
			this._limitarFrame();
			this._actualizarFrame();
		},
		
		_limitarFrame: function() {
			if (this.frameActual < this.frameHasta)
				this.frameActual = this.frameHasta + this.frames - 1;
			this._producto = 1;
			if (this.frameActual == this.frameHasta) this._producto = 4;
		},
		
		_iniciar: function() {
			this.reproducir();
		}
		
	},
	
	opciones: {
		idioma: "es",
		persistirCookies: false,
		
		modoMini: false,
		modoMovil: false,
		modoPro: false,
		modoPremium: false,
		titulo: "",
		rango: "",
		
		tipoMapa: 3,
		modoGlobal: false,
		resaltarPais: true,
		resaltarProvincias: true,
		detectarRetina: false,
		verLocalidades: true,
		verRutas: true,
		
		verRadares: true,
		verSatelite: true,
		verRayos: true,
		verAlertas: false,
		verAvisos: true,
		verReportes: false,
		verSismos: false,
		verPronostico: false,
		
		verEncabezado: true,
		verCruz: true,
		verZoom: true,
		verReproduccion: true,
		
		tipoSatelite: 1,
		usarRadarCapaMosaico: true,
		transicionesSuaves: true,
		integrarEtiquetas: false,
		capasOpacidad: "1",
		
		destacarFondoAvisos: false,
		
		leer: function() {
			if ((!this.persistirCookies) || (!PE) || (!PE.cookies)) return;
			this.tipoMapa = parseInt(PE.cookies.leer('RadSat_tipoMapa', this.tipoMapa.toString()));
			this.resaltarPais = PE.cookies.leer('RadSat_resaltarPais', this.resaltarPais.toString()) == "true";
			this.resaltarProvincias = PE.cookies.leer('RadSat_resaltarProvincias', this.resaltarProvincias.toString()) == "true";
			this.verLocalidades = PE.cookies.leer('RadSat_verLocalidades', this.verLocalidades.toString()) == "true";
			this.verRutas = PE.cookies.leer('RadSat_verRutas', this.verRutas.toString()) == "true";
			this.verRadares = PE.cookies.leer('RadSat_verRutas', this.verRadares.toString()) == "true";
			this.verSatelite = PE.cookies.leer('RadSat_verSatelite', this.verSatelite.toString()) == "true";
			this.verRayos = PE.cookies.leer('RadSat_verRayos', this.verRayos.toString()) == "true";
			this.verAlertas = PE.cookies.leer('RadSat_verAlertas', this.verAlertas.toString()) == "true";
			this.verAvisos = PE.cookies.leer('RadSat_verAvisos', this.verAvisos.toString()) == "true";
			this.verReportes = PE.cookies.leer('RadSat_verReportes', this.verReportes.toString()) == "true";
			this.verSismos = PE.cookies.leer('RadSat_verSismos', this.verSismos.toString()) == "true";
			this.verPronostico = PE.cookies.leer('RadSat_verPronostico', this.verPronostico.toString()) == "true";
			this.tipoSatelite = PE.cookies.leer('RadSat_tipoSatelite', this.tipoSatelite);
			PE.RadSat.mapa._lat = parseFloat(PE.cookies.leer('RadSat_lat', PE.RadSat.mapa._lat.toString()));
			PE.RadSat.mapa._lng = parseFloat(PE.cookies.leer('RadSat_lon', PE.RadSat.mapa._lng.toString()));
			PE.RadSat.mapa._zoom = parseInt(PE.cookies.leer('RadSat_zoom', PE.RadSat.mapa._zoom.toString()));
		},
		
		guardar: function() {
			if ((!this.persistirCookies) || (!PE) || (!PE.cookies)) return;
			PE.cookies.guardar('RadSat_tipoMapa', this.tipoMapa.toString());
			PE.cookies.guardar('RadSat_resaltarPais', this.resaltarPais.toString());
			PE.cookies.guardar('RadSat_resaltarProvincias', this.resaltarProvincias.toString());
			PE.cookies.guardar('RadSat_verLocalidades', this.verLocalidades.toString());
			PE.cookies.guardar('RadSat_verRutas', this.verRutas.toString());
			PE.cookies.guardar('RadSat_verRutas', this.verRadares.toString());
			PE.cookies.guardar('RadSat_verSatelite', this.verSatelite.toString());
			PE.cookies.guardar('RadSat_verRayos', this.verRayos.toString());
			PE.cookies.guardar('RadSat_verAlertas', this.verAlertas.toString());
			PE.cookies.guardar('RadSat_verAvisos', this.verAvisos.toString());
			PE.cookies.guardar('RadSat_verReportes', this.verReportes.toString());
			PE.cookies.guardar('RadSat_verSismos', this.verSismos.toString());
			PE.cookies.guardar('RadSat_verPronostico', this.verPronostico.toString());
			PE.cookies.guardar('RadSat_tipoSatelite', this.tipoSatelite);
			PE.cookies.guardar('RadSat_lat', PE.RadSat.mapa._mapa.getCenter().lat.toString().substring(0,10));
			PE.cookies.guardar('RadSat_lon', PE.RadSat.mapa._mapa.getCenter().lng.toString().substring(0,10));
			PE.cookies.guardar('RadSat_zoom', Math.min(12, Math.max(2, PE.RadSat.mapa._mapa.getZoom())).toString());
		}
		
	},
	
	textos: {
	
		radsat: "RadSat HD",
		
		_iniciar: function () {
			this.actualizar();
		},
		
		actualizar: function() {
			if (PE.RadSat.opciones.idioma.toLowerCase() == "en") {
				this.cargando = "Loading...";
				this.y = "and";
				this.ahora = "Now";
				this.alertas = "Alerts";
				this.avisos = "Warnings";
				this.rayos = "Lightning";
				this.alertas = "Alerts";
				this.avisos = "Warnings";
				this.satelite = "Satellite";
				this.sateliteGOES = "GOES-16";
				this.radar = "Radar";
				this.reportes = "Reports";
				this.sismos = "Earthquakes";
				this.horas = "hours";
				this.dias = "days";
				this.futuro = "future";
				this.temperaturas = "Temperatures";
				this.sensacionTermica = "Feels like";
				this.vientos = "Wind speed";
				this.lluvias = "Rain";
				this.lluviasEstimadas = "24 hour accum";
				this.nubes = "Clouds";
				this.rocio = "Dew point";
				this.indiceUV = "UV index";
				this.ultimas = "Last";
				this.manana = "Tomorrow";
				this.dia = "Day";
				this.pronostico = "Forecast";
				this.datosactuales = "Current conditions";
			} else
			if (PE.RadSat.opciones.idioma.toLowerCase() == "pt") {
				this.cargando = "Carregando...";
				this.y = "e";
				this.ahora = "Agora";
				this.alertas = "Alertas";
				this.avisos = "Avisos";
				this.rayos = "Raios";
				this.satelite = "Satelite";
				this.sateliteGOES = "GOES-16";
				this.radar = "Radar";
				this.reportes = "Reportes";
				this.sismos = "Terremotos";
				this.horas = "horas";
				this.dias = "dias";
				this.futuro = "futuro";
				this.temperaturas = "Temperaturas";
				this.sensacionTermica = "Sensação termica";
				this.vientos = "Velocidade do vento";
				this.lluvias = "Chuva";
				this.lluviasEstimadas = "Acumulado em 24 horas";
				this.nubes = "Nuvens";
				this.rocio = "Ponto de orvalho";
				this.indiceUV = "Indice UV";
				this.ultimas = "Últimas";
				this.manana = "Amanhã";
				this.dia = "Dia";
				this.pronostico = "Previsão";
				this.datosactuales = "Dados atuais";
			} else {
				this.cargando = "Cargando...";
				this.y = "y";
				this.ahora = "Ahora";
				this.rayos = "Rayos a tierra";
				this.alertas = "Alertas";
				this.avisos = "Avisos";
				this.satelite = "Satélite";
				this.sateliteGOES = "GOES-16";
				this.radar = "Radar";
				this.reportes = "Reportes";
				this.sismos = "Sismos registrados";
				this.horas = "horas";
				this.dias = "días";
				this.futuro = "futuro";
				this.temperaturas = "Temperaturas";
				this.sensacionTermica = "Sensación térmica";
				this.vientos = "Velocidad del viento";
				this.lluvias = "Lluvias";
				this.lluviasEstimadas = "Acumulados en 24 horas";
				this.nubes = "Nubes";
				this.rocio = "Punto de rocío";
				this.indiceUV = "Índice UV";
				this.ultimas = "Últimas";
				this.manana = "Mañana";
				this.dia = "Día";
				this.pronostico = "Pronóstico";
				this.datosactuales = "Datos del tiempo";
			}
		}
	
	},
	
	_obtenerFechaServidor: function() {
		jQuery.ajax({
			url: "https://www.pronosticoextendido.net/servicios/obtener-timestamp.php",
			dataType: "html",
			success: function(data) {
				PE.RadSat._fechaServidor = new Date(data);
			}
		});
	},
	
	_detectarDimensiones: function() {
		PE.RadSat.opciones.modoMini = jQuery(document.getElementById(this._contenedor)).innerWidth() < 768;
		PE.RadSat.opciones.modoMovil = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) < 768;
	},
	
	_ventanaCambiada: function() {
		PE.RadSat.encabezado._ventanaCambiada();
		PE.RadSat.controles._ventanaCambiada();
	},
	
	_aplicarModoMovil: function() {
		var verFondoArg = true;
		var verProvincias = true;
		var modoMapa = null;
		if ((this.persistirCookies) && (PE) && (PE.cookies)) {
			verFondoArg = PE.cookies.leer('verFondoArg') != '0';
			verProvincias = PE.cookies.leer('verProvincias') != '0';
			modoMapa = PE.cookies.leer('modoMapa');
		}
		PE.RadSat.mapa.resaltarPais((!PE.RadSat.opciones.modoMovil) && (verFondoArg));
		PE.RadSat.mapa.resaltarProvincias((!PE.RadSat.opciones.modoMovil) && (verProvincias));
		if (modoMapa == null)
			if (PE.RadSat.opciones.modoMovil) PE.RadSat.mapa.tipo(1);
		else {
			if (modoMapa == '1') PE.RadSat.mapa.tipo(1);
			if (modoMapa == '2') PE.RadSat.mapa.tipo(2);
			if (modoMapa == '3') PE.RadSat.mapa.tipo(3);
		}
		PE.RadSat.avisos.destacarFondo(!PE.RadSat.opciones.modoMovil);
		PE.RadSat.opciones.transicionesSuaves = !PE.RadSat.opciones.modoMovil;
	},
	
	cssSufijo: function() {
		if (this.opciones.modoMini) return "-mini";
		return "";
	},
	
	iniciar: function (contenedor, zoom) {
		this._contenedor = contenedor;
		if (document.location.href.toLowerCase().indexOf("extendedforecast") > -1)
			this.opciones.idioma = "en";
		if (document.location.href.toLowerCase().indexOf("previsaoestendida") > -1)
			this.opciones.idioma = "pt";
		else 
			if (PE.opciones != null)
				this.opciones.idioma = PE.opciones.idioma;
		this._obtenerFechaServidor();
		this._detectarDimensiones();
		this._popup = L.popup();
		this.textos._iniciar();
		if (!zoom)
			this.mapa._iniciar(contenedor, 6);
		else
			this.mapa._iniciar(contenedor, zoom);
		this.encabezado._iniciar();
		this.animacion._iniciar();
		this.controles._iniciar();
		if (PE.RadSat.radares.rangos) PE.RadSat.radares.rangos._iniciar();
		this.opciones.leer();
		this._aplicarModoMovil();
		this.mapa.paisActualizado();
		this.mapa._obtenerURLSWeatherAPI();
		this.mapa._obtenerURLSRealEarth();
		this._ventanaCambiada();
		jQuery(window).resize(function() { PE.RadSat._ventanaCambiada() });
    },
	
	iniciado: function() {
		return this._iniciado;
	},
	
	actualizar: function() {
		this._random = Math.floor(Math.random() * 1000000);
		this._fechaBase = new Date();
	},
	
	mostrarSuperposicion: function(url, latMin, lonMin, latMax, lonMax) {
		this.eliminarSuperposicion();
		llb = L.latLngBounds(L.latLng(latMin, lonMin), L.latLng(latMax, lonMax));
		if (!PE.RadSat.mapa._mapa.getPane("superposiciones"))
			PE.RadSat.mapa._crearPane("superposiciones", false, 205);
		this._superponer = L.imageOverlay(url + "?r=" + this._random, llb, {pane: "superposiciones"});
		this._superponer.addTo(PE.RadSat.mapa._mapa);
	},
	
	eliminarSuperposicion: function() {
		if (this._superponer != null) {
			PE.RadSat.mapa._mapa.removeLayer(this._superponer);
			this._superponer = null;
		}
	},
	
	_cargar: function() {
		this.mapa._mapa.setView([this.mapa._lat, this.mapa._lng], this.mapa._zoom);
		this.opciones.verAlertas = !this.opciones.verAlertas;
		this.alertas.mostrar(!this.opciones.verAlertas);
		this.opciones.verAvisos = !this.opciones.verAvisos;
		this.avisos.mostrar(!this.opciones.verAvisos);
		this.opciones.verSatelite = !this.opciones.verSatelite;
		this.satelite.mostrar(!this.opciones.verSatelite);
		this.opciones.verRayos = !this.opciones.verRayos;
		this.rayos.mostrar(!this.opciones.verRayos);
		this.mapa.tipo(this.opciones.tipoMapa);
		PE.RadSat.radares.mostrarVista(0, this.opciones.verRadares);
	}
	
};

