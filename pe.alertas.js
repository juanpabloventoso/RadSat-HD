PE = window.PE || {};

PE.alertas = {

	iniciar: function() {
		this.items = new Array();
		if ((!PE.ubicacion) || (PE.ubicacion.pais.indexOf("Argentina") > -1)) {
			this.origen = 1;
			$.ajax({
				url: '//www.pronosticoextendido.net/servicios/alertas.xml',
				dataType: 'xml',
				success: function(data) {
					$(data).find("alerta").each(function() {
						PE.alertas.items[PE.alertas.items.length] = this;
					});
					PE.alertas._iniciado = true;
					if (PE.avisos._iniciado) PE._actualizarAlertas();
				}
			});
		} 
		if ((PE.ubicacion != null) && ((PE.ubicacion.pais.indexOf("Brasil") > -1) || (PE.ubicacion.pais.indexOf("Brazil") > -1))) {
			this.origen = 2;
			var that = this;
			jQuery.ajax({
				url: '//www.pronosticoextendido.net/servicios/obtener-alertas-br.php', 
				dataType: 'xml', 
				success: function(data) {
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
							PE.alertas.items[PE.alertas.items.length] = this;
					}
				});
				PE.alertas._iniciado = true;
				PE._actualizarAlertas();
			}
			});
		}
		if ((PE.ubicacion != null) && (PE.ubicacion.pais.indexOf("Uruguay") > -1)) {
			this.origen = 3;
			var that = this;
			jQuery.getJSON('//www.pronosticoextendido.net/servicios/obtener-alertas-uy.php', function(data) {
				PE.alertas.items = data.advertencias;
				PE.alertas._iniciado = true;
				PE._actualizarAlertas();
			});
		}
		if ((PE.ubicacion != null) && ((PE.ubicacion.pais.indexOf("España") > -1) || (PE.ubicacion.pais.indexOf("Spain") > -1))) {
			this.origen = 4;
			var that = this;
			// https://services.meteored.com/web/warnings/css/18_0.geo.json
			jQuery.getJSON('//www.pronosticoextendido.net/servicios/obtener-alertas-es.php', function(data) {
				PE.alertas.items = data.alertas;
				PE.alertas._iniciado = true;
				PE._actualizarAlertas();
			});
		}
	},
	
	obtenerParaUbicacion: function(provincia) {
		var items = new Array();
		for (var i = 0; i < this.items.length; i++) 
			if (this.items[i].attributes["provincias"].value.indexOf(provincia) > -1)
				items[items.length] = this.items[i];
		return items;
	},

	dibujar: function(span1, span2, provincia, exclusion, texto) {
		var num = 1;
		var alertatexto = "";
		if ((typeof texto !== 'undefined') && (texto != ''))
			alertatexto = texto;
		for (var i = 0; i < this.items.length; i++) {
			var html = "";
			if (this.origen == 1) {
				if ((typeof provincia !== 'undefined') && (provincia != ''))
					if (this.items[i].attributes["provincias"].value.indexOf(provincia) == -1) continue;
				if ((typeof exclusion !== 'undefined') && (exclusion != ''))
					if (this.items[i].attributes["id"].value.indexOf(exclusion) != -1) continue;
				if (alertatexto == "")
					textoactual = " - " + this.items[i].attributes["hora"].value;
				else
					textoactual = alertatexto;
				html = "<div id=\"div-alerta-" + num + "\" class=\"div-alerta\"><a href=\"/alertas/detalle/" + 
				this.items[i].attributes["id"].value + "/\"><div class=\"div-alerta-titulo\" style=\"background-color: " + 
				this.items[i].attributes["color"].value + "\">Alerta por " + this.items[i].attributes["tipo"].value.toLowerCase() + 
				" <span style='font-weight: 300'>" + textoactual + "</span></div></a></div><br />";
			}
			if (this.origen == 2) {
				if (alertatexto == "") {
					fecha = new Date(this.items[i].childNodes[7].innerHTML);
					textoactual = " - " + fecha.getDate()  + "/" + (fecha.getMonth()+1) + "/" + fecha.getFullYear() + " " + fecha.getHours() + ":" + fecha.getMinutes();
				}
				else
					textoactual = alertatexto;
				var tit = this.items[i].childNodes[1].innerHTML;
				color = "#db3";
				if (tit.endsWith("Perigo")) color = "#e72";
				var cont = this.items[i].childNodes[5].innerHTML;
				var p1 = cont.indexOf("rea</th><td>") + 12;
				var p2 = cont.indexOf("</td></tr><tr><th align=\"left\">Link");
				html = "<div id=\"div-alerta-" + num + "\" class=\"div-alerta\"><div class=\"div-alerta-titulo\" style=\"background-color: " + 
				color + "\">" + tit + "<span style='font-weight: 300'>" + textoactual + "</span></div>" + 
				"<div class=\"div-alerta-cont\" id=\"div-alerta-cont-" + num + "\">" + cont.substring(p1, p2) + 
				"</div></div><br />";
			}
			if (this.origen == 3) {
				if ((typeof provincia !== 'undefined') && (provincia != ''))
					if (this.items[i].zonas.indexOf(provincia) == -1) continue;
				if (alertatexto == "")
					textoactual = " - " + this.items[i].comienzo.split(' ')[1]; 
				else
					textoactual = alertatexto;
				color = "#db3";
				if ((this.items[i].riesgoFenomeno.riesgoViento > 3) ||
					(this.items[i].riesgoFenomeno.riesgoLluvia > 3) ||
					(this.items[i].riesgoFenomeno.riesgoTormenta > 3) ||
					(this.items[i].riesgoFenomeno.riesgoVisibilidad > 3) ||
					(this.items[i].riesgoFenomeno.riesgoCalor > 3) ||
					(this.items[i].riesgoFenomeno.riesgoFrio > 3))
					color = "#c22";
				else
				if ((this.items[i].riesgoFenomeno.riesgoViento > 2) ||
					(this.items[i].riesgoFenomeno.riesgoLluvia > 2) ||
					(this.items[i].riesgoFenomeno.riesgoTormenta > 2) ||
					(this.items[i].riesgoFenomeno.riesgoVisibilidad > 2) ||
					(this.items[i].riesgoFenomeno.riesgoCalor > 2) ||
					(this.items[i].riesgoFenomeno.riesgoFrio > 2))
					color = "#e72";
				else
				if ((this.items[i].riesgoFenomeno.riesgoViento > 1) ||
					(this.items[i].riesgoFenomeno.riesgoLluvia > 1) ||
					(this.items[i].riesgoFenomeno.riesgoTormenta > 1) ||
					(this.items[i].riesgoFenomeno.riesgoVisibilidad > 1) ||
					(this.items[i].riesgoFenomeno.riesgoCalor > 1) ||
					(this.items[i].riesgoFenomeno.riesgoFrio > 1))
					color = "#ed3";				
				html = "<div id=\"div-alerta-" + num + "\" class=\"div-alerta\"><div class=\"div-alerta-titulo\" style=\"background-color: " + 
				color + "\">Advertencia por " + this.items[i].fenomeno.toLowerCase() + 
				" <span style='font-weight: 300'>" + textoactual + "</span></div>" +
				"<div class=\"div-alerta-cont\" id=\"div-alerta-cont-" + num + "\">" + this.items[i].descripcion +
				"</div></div><br />";
			}
			if (this.origen == 4) {
				if (alertatexto != "")
					textoactual = alertatexto;
				color = "#db3";
				html = "<div id=\"div-alerta-" + num + "\" class=\"div-alerta\"><div class=\"div-alerta-titulo\" style=\"background-color: " + 
				color + "\">" + this.items[i].etiqueta + "</div>" +
				"<div class=\"div-alerta-cont\" id=\"div-alerta-cont-" + num + "\">";
				for (var j = 0; j < this.items[i].alertas.length; j++) {
					html += "<b>" + this.items[i].alertas[j].titulo + "</b><br /><hr />" + 
					PE.funciones.reemplazarTodos("<li>", "", PE.funciones.reemplazarTodos("</li>", "", this.items[i].alertas[j].probabilidad)) + "<br />" + 
					PE.funciones.reemplazarTodos("<li>", "", PE.funciones.reemplazarTodos("</li>", "", this.items[i].alertas[j].comienzo)) + "<br />" + 
					PE.funciones.reemplazarTodos("<li>", "", PE.funciones.reemplazarTodos("</li>", "", this.items[i].alertas[j].fin)) + "<br />" +
					PE.funciones.reemplazarTodos("<li>", "", PE.funciones.reemplazarTodos("</li>", "", this.items[i].alertas[j].ambito)) + "<br />" + 
					PE.funciones.reemplazarTodos("<li>", "", PE.funciones.reemplazarTodos("</li>", "", this.items[i].alertas[j].comentario)) + "<br /><br />";
				}
				html += "</div></div><br />";
			}
			document.getElementById(span1).innerHTML += html;	
			num++;
		}
		if ((typeof span2 !== 'undefined') && (span2 != '')) {
			if (num < 2)
				$("#" + span2).html("No hay alertas vigentes.");
			else
				$("#" + span2).html("");
		}
	},

	dibujarDesplegable: function(span1, span2, provincia, exclusion) {
		var num = 1;
		for (var i = 0; i < this.items.length; i++) {
			if ((typeof provincia !== 'undefined') && (provincia != ''))
				if (this.items[i].attributes["provincias"].value.indexOf(provincia) == -1) continue;
			if ((typeof exclusion !== 'undefined') && (exclusion != ''))
				if (this.items[i].attributes["id"].value.indexOf(exclusion) != -1) continue;
			html = "<div id=\"div-alerta-" + num + "\" class=\"div-alerta\" onclick=\"" +
			"if ($('#div-alerta-cont-" + num + "').css('display') == 'none') { $('#div-alerta-cont-" + num + "').show(); " +
			"$('#div-alerta-mas-" + num + "').html('-'); } else  { $('#div-alerta-cont-" + num + "').hide(); $('#div-alerta-mas-" + num + "').html('+'); }" +
			"\"><div class=\"div-alerta-encabezado\" style=\"background-color: " + this.items[i].attributes["colorTrans"].value + 
			"\"><div class=\"div-alerta-titulo\">Alerta por " + this.items[i].attributes["tipo"].value.toLowerCase() + 
			"</div><div id=\"div-alerta-hora-" + num + "\" class=\"div-alerta-titulo-hora\">" + this.items[i].attributes["hora"].value + "</div>" +
			"<div id=\"div-alerta-zonas-" + num + "\" class=\"div-alerta-titulo-zonas\">" + 
			this.items[i].attributes["zonas"].value + "</div><div class=\"div-alerta-cont\" id=\"div-alerta-cont-" + num + "\" style=\"display: none\">" + 
			this.items[i].attributes["descripcion"].value + "</div></div></div>";
			document.getElementById(span1).innerHTML += html;	
			num++;
		}
		if ((typeof span2 !== 'undefined') && (span2 != '')) {
			if (num < 2)
				$("#" + span2).html("No hay alertas vigentes.");
			else
				$("#" + span2).html("");
		}
	}
	
}

PE.avisos = {

	iniciar: function() {
		this.items = new Array();
		this.poligonos = new Array();
		if ((!PE.ubicacion) || (PE.ubicacion.pais.indexOf("Argentina") > -1)) {
			if ((PE.RadSat != null) && (PE.RadSat.avisos._avisos != null)) {
				for (var i = 0; i < PE.RadSat.avisos._avisos.length; i++) {
					PE.avisos.items[PE.avisos.items.length] = PE.RadSat.avisos._avisos[i];
					PE.avisos.poligonos[PE.avisos.poligonos.length] = PE.avisos._obtenerPoligono($(PE.RadSat.avisos._avisos[i]).attr("area"));
				}
				PE.RadSat.encabezado.actualizarTiposAvisos(true);
			} else {
				$.ajax({
					url: '//www.pronosticoextendido.net/servicios/avisos.xml',
					dataType: 'xml',
					success: function(data) {
						$(data).find("aviso").each(function() {
							PE.avisos.items[PE.avisos.items.length] = this;
							PE.avisos.poligonos[PE.avisos.poligonos.length] = PE.avisos._obtenerPoligono($(this).attr("area"));
						});
						PE.avisos._iniciado = true;
						if (PE.alertas._iniciado) PE._actualizarAlertas();
					}
				});
			}
		}
	},
	
	avisosPorUbicacion: function(lat, lon) {
		var items = new Array();
		for (var i = 0; i < this.items.length; i++)
			if (PE.funciones.puntoEnPoligono(lat, lon, this.poligonos[i]))
				items[items.length] = this.items[i];
		return items;
	},
	
	_obtenerPoligono: function(area) {
		poligono = new Array();
		een = 0;
		itemLat = "";
		jQuery(area.split(" ")).each(function() {
			if (een == 1)
				poligono.push(new Array(parseFloat(itemLat), parseFloat(this)));
			else 
				itemLat = this;
			if (een == 0) een = 1; else een = 0;
		});
		return poligono;
	},

	dibujar: function(span1, span2, provincia, exclusion, texto, lat, lon) {
		var num = 1;
		var acptexto = "";
		if ((typeof texto !== 'undefined') && (texto != ''))
			acptexto = texto;
		for (var i = 0; i < this.items.length; i++) {
			if ((typeof provincia !== 'undefined') && (provincia != ''))
				if (this.items[i].attributes["provincias"].value.indexOf(provincia) == -1) continue;
			if ((typeof exclusion !== 'undefined') && (exclusion != ''))
				if (this.items[i].attributes["id"].value.indexOf(exclusion) != -1) continue;
			if ((typeof lat !== 'undefined') && (!PE.funciones.puntoEnPoligono(lat, lon, this.poligonos[i]))) continue;
			if (acptexto == "")
				textoactual = " hasta las " + this.items[i].attributes["hasta"].value;
			else
				textoactual = acptexto;
			html = "<div id=\"div-acp-" + num + "\" class=\"div-alerta\"><a href=\"/alertas/detalle/" + 
			this.items[i].attributes["id"].value + "/\"><div class=\"div-alerta-titulo\" style=\"background-color: " + 
			this.items[i].attributes["color"].value + "\">Aviso a corto plazo por " + this.items[i].attributes["tipo"].value.toLowerCase() + 
			" <span style='font-weight: 300'>" + textoactual + "</span></div></a></div><br />";
			document.getElementById(span1).innerHTML += html;	
			num++;
		}
		if ((typeof span2 !== 'undefined') && (span2 != '')) {
			if (num < 2)
				$("#" + span2).html("No hay avisos a corto plazo vigentes.");
			else
				$("#" + span2).html("");
		}
	}	
	
}

PE.riesgos = {

	obtener: function(lat, lon, tipo, callback) {
		var latMin = lat + 0.5;
		var lonMin = lon + 0.5;
		var latMax = lat - 0.5;
		var lonMax = lon - 0.5;
		$.get("//www.pronosticoextendido.net/servicios/obtener-" + tipo + ".php?latMin=" + latMin + "&lonMin=" + lonMin + 
			"&latMax=" + latMax + "&lonMax=" + lonMax, function(data) {
			callback(data);
		});
	},
	
	informarRayos: function(lista, latBase, lonBase) {
		if ($("#spnRayos").html() != "") return;
		var dist = 1000;
		jQuery(lista).find("rayo").each(function(index, value) {
			var lat = jQuery(this).attr("lat");
			var lon = jQuery(this).attr("lon");
			var utc = jQuery(this).attr("utc");
			var timeAgo = (new Date() - (new Date(Date.parse(utc)))) / 1000 / 60;
			if (timeAgo <= 15) {
				var dist2 = PE.funciones.distanciaLatLng(lat, lon, latBase, lonBase);
				if (dist2 < dist) dist = dist2;
			}
		});
		if (PE.opciones.idioma == "es") {
			if (dist < 21) $("#spnRayos").html("<a href='/prevencion/rayos/' target='_blank' class='a-prono-rayos'>" +
					"RadSat detectó <b>caída de rayos</b> a menos de " + Math.max(2, Math.round(dist / 10) * 10) + " km. Se recomienda buscar refugio&nbsp;<span>»</span></a><br />");
			else if (dist < 101)
				$("#spnRayos").html("<a href='/prevencion/rayos/' target='_blank' class='a-prono-rayos'>" +
					"RadSat detectó <b>caída de rayos</b> a menos de " + Math.max(2, Math.round(dist / 10) * 10) + " km. de esta ubicación&nbsp;<span>»</span></a><br />");
		}
		if (PE.opciones.idioma == "en") {
			if (dist < 21) $("#spnRayos").html("<a class='a-prono-rayos'>" +
					"RadSat detected <b>lightning strikes</b> less than " + Math.max(2, Math.round(Math.round(dist / 10) * 10 * 0.621371)) + " mi. Seek shelter now&nbsp;<span>»</span></a><br />");
			else if (dist < 101)
				$("#spnRayos").html("<a class='a-prono-rayos'>" +
					"RadSat detected <b>lightning strikes</b> less than " + Math.max(2, Math.round(Math.round(dist / 10) * 10 * 0.621371)) + " mi. from this location&nbsp;<span>»</span></a><br />");
		}
		if (PE.opciones.idioma == "pt") {
			if (dist < 21) $("#spnRayos").html("<a class='a-prono-rayos'>" +
					"RadSat detectou <b>raios</b> a menos do que " + Math.max(2, Math.round(dist / 10) * 10) + " km. Recomenda-se buscar refúgio&nbsp;<span>»</span></a><br />");
			else if (dist < 101)
				$("#spnRayos").html("<a class='a-prono-rayos'>" +
					"RadSat detectou <b>raios</b> a menos do que " + Math.max(2, Math.round(dist / 10) * 10) + " km. desta localização&nbsp;<span>»</span></a><br />");
		}
	},
	
	informarGranizo: function(lista, latBase, lonBase) {
		if ($("#spnGranizo").html() != "") return;
		var dist = 1000;
		jQuery(lista).find("granizo").each(function(index, value) {
			var lat = jQuery(this).attr("lat");
			var lon = jQuery(this).attr("lon");
			var dist2 = PE.funciones.distanciaLatLng(lat, lon, latBase, lonBase);
			if (dist2 < dist) dist = dist2;
		});	
		if (dist < 21)
			$("#spnRayos").html("<a href='/radsat/' target='_blank' class='a-prono-granizo'>" +
				"RadSat detectó <b>posible granizo</b> a menos de " + Math.max(2, Math.round(dist / 10) * 10) + " km. Recomendamos proteger vehículos y refugiarse&nbsp;<span>»</span></a><br />");
		else
		if (dist < 101)
			$("#spnRayos").html("<a href='/radsat/' target='_blank' class='a-prono-granizo'>" +
				"RadSat detectó <b>posible granizo</b> a menos de " + Math.max(2, Math.round(dist / 10) * 10) + " km. de esta ubicación&nbsp;<span>»</span></a><br />");
	}

}

PE.alertas.iniciar();
PE.avisos.iniciar();

