var PE = {

	_version: "86",

	html: {
	
		_iniciar: function() {
			this.head = document.getElementsByTagName('head')[0];
			this.body = document.getElementsByTagName('body')[0];
			if (PE.pagina.obtenerParametro("fuente") == "android_app") {
				$(".div-header").hide();
				$(".div-header-spacer").hide();
				$(".div-pie").hide();
			}
			$("#div-menu").click(function(event){
			   event.stopPropagation();
			});			
			$("#aMovilMenu").click(function(event){
			   event.stopPropagation();
			});			
			$("html").click(function(event) {
				if (PE.movil._modo == 1)
					PE.movil.mostrarMenu(false);
			}); 

		}
	},

	sesion: {
	
		id: "",

		leer: function(nombre) {
			if (window.localStorage) {
				return window.localStorage.getItem(nombre);
			} else {
				return PE.cookies.leer(nombre);
			}
		},
		
		guardar: function(nombre, valor) {
			if (window.localStorage) {
				window.localStorage.setItem(nombre, valor);
			} else {
				PE.cookies.guardar(nombre, valor);
			}
		}
	
	},
	
	cookies: {

		leer: function(nombre, defecto) {
			var result = (nombre = new RegExp('(?:^|;\\s*)' + 
			('' + nombre).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + 
			'=([^;]*)').exec(document.cookie)) && nombre[1];
			if ((result == null) && (defecto != null)) result = defecto;
			return result;
		},	

		guardar: function(nombre, valor) {
			document.cookie = escape(nombre) + "=" + escape(valor) + 
			";max-age=2147483647;expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/";
		},
			
		aceptarMensaje: function() {
			document.getElementById("cookie1").style.display = "none";
			localStorage.aceptarCookies = "true";
		},
		
		comprobarMensaje: function() {
			if ((!localStorage) || (localStorage.aceptarCookies == "true"))
				document.getElementById("cookie1").style.display = "none";
		}

	},
	
	ventana: {
	
		ancho: 0,
		alto: 0,
		
		_actualizar: function() {
			this.ancho = window.innerWidth || document.documentElement.clientWidth || PE.html.head.clientWidth;
			this.alto = window.innerHeight || document.documentElement.clientHeight || PE.html.head.clientHeight;
			this.esGrande = this.ancho > 1023;
			this.esMedia = this.ancho > 767;
			this.esChica = this.ancho < 768;
		},
		
		_iniciar: function() {
			this._actualizar();
			var that = this;
			$(window).on("resize", function() {
				that._actualizar();
			});
		}
	
	},
	
	pagina: {
			
		obtenerParametro: function(nombre) {
			if (nombre = (new RegExp('[?&]' + encodeURIComponent(nombre) + '=([^&]*)')).exec(location.search))
				return decodeURIComponent(nombre[1]);
		}
	
	},
	
	movil: {
	
		_modo: 0,

		mostrarBuscar: function(mostrar) {
			if (mostrar) {
				$("#divHeaderBuscar").show();
				$(".div-header-contenido-sup").css("right", "50px");
				$(".div-header-movil").hide();
				$("#aMovilMenu")[0].className = "header-icono header-icono-cerrar";
				this._modo = 2;
			} else {
				$("#divHeaderBuscar").hide();
				$(".div-header-movil").show();
				$(".div-header-contenido-sup").css("right", "100px");
				$("#aMovilMenu")[0].className = "header-icono header-icono-menu";
					this._modo = 0;
			}
		},

		mostrarMenu: function(mostrar) {
			if (mostrar) {
				if (this._modo == 2) {
					if ($("#divHeaderBuscar").is(":visible")) 
						PE.movil.mostrarBuscar(false);
					this._modo = 0;
				} else {
					if ($("#div-menu").is(":visible")) {
						$("#div-menu").slideUp();
						if (PE.ventana.esChica) {
							$(".div-pie").show();
							$("body").css("overflow", "auto");
						}
						this._modo = 0;
						$("#aMovilMenu")[0].className = "header-icono header-icono-menu";
					} else {
						$("#div-menu").slideDown();
						if (PE.ventana.esChica) {
							$(".div-pie").hide();
							$("body").css("overflow", "hidden");
						} 
						this._modo = 1;
						$("#aMovilMenu")[0].className = "header-icono header-icono-cerrar";
					}
				}
			} else {
				$("#div-menu").slideUp();
				this._modo = 0;
				$("#aMovilMenu")[0].className = "header-icono header-icono-menu";
			}
		}
		
	},
	
	ads: {
	
		adSense: {
					
			_pubID: "4874621521685644",
			habilitarPaginaMovil: true,

			crearBanner: function(contenedor, slot, ancho, alto, region, borde, html) {
				if (PE.usuario.premium) return;
				var s = "";
				if (typeof(html) != "undefined") s += html;
				if (borde) s += "<div class='div-ads-borde' style='width: " + ancho + "px; height: " + alto + "px'>";
				s += "<ins class='adsbygoogle' style='display:inline-block;width:" + ancho + "px;height:" + alto + 
					 "px' data-ad-region='" + region + 
					 "' data-ad-client='ca-pub-" + this._pubID + "' data-ad-slot='" + slot + "'></ins>";
				if (borde) {
					if (window.location.href.indexOf("/en/") != -1)
						s += "<span>Advertising</span></div>";
					else
						s += "<span>Anuncios</span></div>";
				}
				$("#" + contenedor).html(s);
				(adsbygoogle = window.adsbygoogle || []).push({});
			},

			crearBannerResponsive: function(contenedor, slot, region, borde, html) {
				if (PE.usuario.premium) return;
				var s = "";
				if (typeof(html) != "undefined") s += html;
				if (borde) s += "<div class='div-ads-borde' style='margin: 0'>";
				s += "<ins class='adsbygoogle' style='display:block' data-ad-region='" + region + 
					 "' data-ad-client='ca-pub-" + this._pubID + "' data-ad-slot='" + slot + 
					 "' data-ad-format='auto'></ins>";
				if (borde) {
					if (window.location.href.indexOf("/en/") != -1)
						s += "<span>Advertising</span></div>";
					else
						s += "<span>Anuncios</span></div>";
				}
				$("#" + contenedor).html(s);
				(adsbygoogle = window.adsbygoogle || []).push({});
			},
			
			_iniciar: function() {
				if (PE.usuario.premium) return;
				if ((PE.ventana.esChica) && (this.habilitarPaginaMovil)) {
				  (adsbygoogle = window.adsbygoogle || []).push({
					google_ad_client: "ca-pub-" + this._pubID,
					enable_page_level_ads: true
				  });
				}
			}
		
		},
		
		engageYa: {
		},
		
		_iniciar: function() {
			this.adSense._iniciar();
		}
	
	},
	
	opciones: {
	
		idioma: "es",
		idiomaNavegador: "es",
		
		urlIdioma: "",
		urlES: "",
		urlEN: "",
		urlPT: "",
		
		_iniciar: function() {
			if (window.location.href.indexOf("extendedforecast") != -1) this.idioma = "en";
			if (window.location.href.indexOf("previsaoestendida") != -1) this.idioma = "pt";
		},
		
		aceptarIdioma: function(idioma) {
			document.getElementById("langSel").style.display = "none";
			localStorage.aceptarIdioma = "true";
			if ((idioma == "es") && (PE.opciones.urlES != "")) { window.location.replace(PE.opciones.urlES); return; }
			if ((idioma == "en") && (PE.opciones.urlEN != "")) { window.location.replace(PE.opciones.urlEN); return; }
			if ((idioma == "pt") && (PE.opciones.urlPT != "")) { window.location.replace(PE.opciones.urlPT); return; }
		},
		
		ignorarIdioma: function() {
			document.getElementById("langSel").style.display = "none";
			localStorage.ignorarIdioma = "true";
		},
		
		comprobarIdioma: function() {
			this.idiomaNavegador = navigator.language || navigator.userLanguage;
			if (PE.pagina.obtenerParametro("forzaridioma") == "1") {
				localStorage.ignorarIdioma = "true";
				localStorage.aceptarIdioma = "false";
				return;
			}
			if ((!localStorage) || (localStorage.ignorarIdioma == "true")) return;
			if (((this.idiomaNavegador.indexOf("en") > -1) || (this.idiomaNavegador.indexOf("th") > -1) ||
				(this.idiomaNavegador.indexOf("fr") > -1) || (this.idiomaNavegador.indexOf("it") > -1) ||
				(this.idiomaNavegador.indexOf("pl") > -1) || (this.idiomaNavegador.indexOf("de") > -1)) && 
				(window.location.href.indexOf("extendedforecast") == -1)) {
				if (localStorage.aceptarIdioma == "true") {
					if (PE.opciones.urlEN != "") { window.location.replace(PE.opciones.urlEN); return; }
				} else {
					document.getElementById("langSel").style.display = "block";
					document.getElementById("langSelEN").style.display = "block";
					document.getElementById("langSelEN").style.width = Math.min(PE.ventana.ancho - 100, 450) + "px";
					document.getElementById("langSelEN").style.height = Math.min(PE.ventana.alto - 100, 250) + "px";
					document.getElementById("langSelEN").style.marginLeft = (-(Math.min(PE.ventana.ancho - 100, 450) / 2)) + "px";
					document.getElementById("langSelEN").style.marginTop = (-(Math.min(PE.ventana.alto - 100, 250) / 2)) + "px";
				}
			}
			if ((this.idiomaNavegador.indexOf("pt") > -1) && (window.location.href.indexOf("previsaoestendida") == -1)) {
				if (localStorage.aceptarIdioma == "true") {
					if (PE.opciones.urlPT != "") { window.location.replace(PE.opciones.urlPT); return; }
				} else {
					document.getElementById("langSel").style.display = "block";
					document.getElementById("langSelPT").style.display = "block";
					document.getElementById("langSelPT").style.width = Math.min(PE.ventana.ancho - 100, 450) + "px";
					document.getElementById("langSelPT").style.height = Math.min(PE.ventana.alto - 100, 250) + "px";
					document.getElementById("langSelPT").style.marginLeft = (-(Math.min(PE.ventana.ancho - 100, 450) / 2)) + "px";
					document.getElementById("langSelPT").style.marginTop = (-(Math.min(PE.ventana.alto - 100, 250) / 2)) + "px";
				}
			}
			if ((this.idiomaNavegador.indexOf("es") > -1) && ((window.location.href.indexOf("extendedforecast") != -1) || 
				(window.location.href.indexOf("previsaoestendida") != -1))) {
				if (localStorage.aceptarIdioma == "true") {
					if (PE.opciones.urlES != "") { window.location.replace(PE.opciones.urlES); return; }
				} else {
					document.getElementById("langSel").style.display = "block";
					document.getElementById("langSelES").style.display = "block";
					document.getElementById("langSelES").style.width = Math.min(PE.ventana.ancho - 100, 450) + "px";
					document.getElementById("langSelES").style.height = Math.min(PE.ventana.alto - 100, 250) + "px";
					document.getElementById("langSelES").style.marginLeft = (-(Math.min(PE.ventana.ancho - 100, 450) / 2)) + "px";
					document.getElementById("langSelES").style.marginTop = (-(Math.min(PE.ventana.alto - 100, 250) / 2)) + "px";
				}
			}
		}

	},
	
	ubicacion: {
	
		pais: "",
		provincia: "",
		
		geolocalizar: function() {
			if (navigator.geolocation)
				navigator.geolocation.getCurrentPosition(PE.ubicacion._alGeolocalizar);
		},
	
		_alGeolocalizar: function(position) {
			window.location = "https://www.pronosticoextendido.net/servicios/geolocalizar.aspx?lat=" + position.coords.latitude + "&lon=" + 
			position.coords.longitude + "&idioma=" + PE.opciones.idioma;
		}

	},
	
	usuario: {
	
		premium: false,
		autenticado: false,
		id: 0,
		nombre: "",
		
		autenticar: function(id, nombre, descripcion) {
			this.autenticado = true;
			this.id = id;
			this.nombre = nombre;
		}
	
	},
	
	funciones: {

		distanciaLatLng: function(lat1, lon1, lat2, lon2) {
			var radlat1 = Math.PI * lat1/180;
			var radlat2 = Math.PI * lat2/180;
			var theta = lon1-lon2;
			var radtheta = Math.PI * theta/180;
			var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
			dist = Math.acos(dist);
			dist = dist * 180/Math.PI;
			dist = dist * 60 * 1.1515;
			dist = dist * 1.609344;
			return dist;
		},
		
		puntoEnPoligono: function(lat, lng, poligono) {
			var inside = false;
			for (var i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
				var xi = poligono[i][0], yi = poligono[i][1];
				var xj = poligono[j][0], yj = poligono[j][1];
				var intersect = ((yi > lng) != (yj > lng))
					&& (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
				if (intersect) inside = !inside;
			}
			return inside;
		},
				
		reemplazarTodos: function(find, replace, str) {
		    return str.replace(new RegExp(find, 'g'), replace);
		}
		
	},
	
	iniciar: function() {
		this.html._iniciar();
		this.opciones._iniciar();
		this.ventana._iniciar();
		this.ads._iniciar();
		this._iniciarMenu();
		this.crearScript("//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", 1);
		this.crearScript("//www.pronosticoextendido.net/recursos/js/lazy.min.js?v=" + this._version, 1);
		this.crearScript("//www.pronosticoextendido.net/recursos/js/pe.alertas.min.js?v=" + this._version, 1);
		this.crearScript("//www.pronosticoextendido.net/recursos/js/social-share-kit.min.js?v=" + this._version, 1);
		this.crearScript("//www.pronosticoextendido.net/recursos/js/lightbox.min.js?v=" + this._version, 1);
	},
	
	cargarDatosActuales: function() {
		$.ajax({
			url: "/servicios/obtener-ubicacion.aspx?ancho=" + PE.ventana.ancho,
			dataType: "html",
			success: function(data){
				if (data.substring(0, 5) == "lang:") { 
					if ((data.substring(5, 7) == "es") && (PE.opciones.urlES != "")) { window.location.replace(PE.opciones.urlES); return; }
					if ((data.substring(5, 7) == "en") && (PE.opciones.urlEN != "")) { window.location.replace(PE.opciones.urlEN); return; }
					if ((data.substring(5, 7) == "pt") && (PE.opciones.urlPT != "")) { window.location.replace(PE.opciones.urlPT); return; }
				}
				$("#spnPronoLocalidad").html(data.split('|')[0]);
				if (PE.ventana.esChica) {
					if ($("#spnPronoAhora")[0] != null)
						$("#spnPronoAhora").html(data.split('|')[1]);
				} else {
					if ($("#spnPronoAhoraGrande")[0] != null) {
						text = data.split('|')[1] + "<style>.prono-ahora-izq { float: none; max-width: initial } .prono-ahora-cond { font-size: 1.2em } .prono-seccion-bg { height: 452px } .prono-ahora-izq { height: 200px }</style>";
						$("#spnPronoAhoraGrande").html(text);
					}
				}
			}
		});
	},

	_cargarAsync: function() {
        clearInterval(this._reloj); 
		if (!PE.ventana.esChica) this.crearCss("//www.pronosticoextendido.net/recursos/css/print.min.css", "print");
		this.crearCss("//www.pronosticoextendido.net/recursos/css/lightbox.min.css");
		// this.crearScript("//www.pronosticoextendido.net/recursos/js/lazy.min.js?v=" + this._version, 1);
		// this.crearScript("//www.pronosticoextendido.net/recursos/js/pe.alertas.min.js?v=" + this._version, 1);
		// this.crearScript("//www.pronosticoextendido.net/recursos/js/social-share-kit.min.js?v=" + this._version, 1);
		// this.crearScript("//www.pronosticoextendido.net/recursos/js/lightbox.min.js?v=" + this._version, 1);
		if (typeof(pe_alCargarAsync) != "undefined") pe_alCargarAsync()
    },

	crearCss: function(src, media) {
		var css = document.createElement("link");
		css.type = "text/css";
		css.rel = "stylesheet";
		css.href = src;
		if (media)
			css.media = media;
		document.body.appendChild(css);
	},

	crearScript: function(src, modo, callback) {
		var js = document.createElement("script");
		js.type = "text/javascript";
		if (modo == 1)
			js.async = true;
		if (modo == 2)
			js.defer = true;
		if (callback) 
			js.onload = callback;
		js.src = src;
		document.body.appendChild(js);
	},

	crearRadSat: function() {
		PE.crearCss("//www.pronosticoextendido.net/recursos/css/leaflet.min.css?v=" + PE._version);
		PE.crearScript("//www.pronosticoextendido.net/recursos/js/leaflet.min.js?v=" + PE._version, 1, PE._leafletCargado);
	},

	_leafletCargado: function() {
		PE.crearCss("//www.pronosticoextendido.net/recursos/css/pe.radsat.min.css?v=" + PE._version);
		PE.crearScript("//www.pronosticoextendido.net/recursos/js/pe.radsat.min.js?v=" + PE._version, 1, PE._radSatCargado);
	},
	
	_radSatCargado: function() {
		if (typeof(pe_RadSatCargado) != "undefined") pe_RadSatCargado();
	},
	
	_iniciarMenu: function() {
		var alertasCantidad = PE.sesion.leer("menuAlertasCantidad");
		if ((alertasCantidad != null) && (alertasCantidad != "") && (alertasCantidad != "0")) {
			$("#spnMenuAlertas").html(alertasCantidad);
			$("#spnMenuAlertas").css("display", "inline");
		} else 
			$("#spnMenuAlertas").hide();
	},

	_actualizarAlertas: function() {
		var alertasCantidad = PE.alertas.items.length + PE.avisos.items.length;
		if (alertasCantidad > 0) {
			$("#spnMenuAlertas").html(alertasCantidad);
			$("#spnMenuAlertas").css("display", "inline");
		} else 
			$("#spnMenuAlertas").hide();
		PE.sesion.guardar("menuAlertasCantidad", alertasCantidad);
		if (typeof(pe_alActualizarAlertas) != "undefined") pe_alActualizarAlertas();
	}
	
}


$(document).ready(function() { PE._cargarAsync(); });