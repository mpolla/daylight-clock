// Transform floating point hours (0.00 ... 23.99)
// into radians (-PI/4 ... + 3*PI/4)
function hour2rad(hour, mode) {
    if (mode == 12) {
	if (12 <= hour) {
	    hour = hour - 12;
	}
	return -Math.PI/2 + (hour/12.0)*Math.PI*2;
    }
    return -Math.PI/2 + (hour/24.0)*Math.PI*2;
}

// 12 hour format
function dom12h() {
    return daylightometer(12);
}

// 24 hour format
function dom24h() {
    return daylightometer(24);
}

// Left zero-pad numbers
function zeroPad( number, width) {
    width -= number.toString().length;
    if ( width > 0 )
	return new Array(width + (/\./.test( number ) ? 2 : 1)).join('0') + number;
    return number;
}

// Transform floating point value into hour representation
// e.g. 16.82 --> "16:49"
function hourstr(hour) {
    return "" + Math.floor(hour) + ":" + zeroPad(Math.round(60 * (hour % 1)), 2);
}

// Draw clock
function daylightometer(mode) {
    
    //var d = new Date(2010, 5, 21, 14, 37, 33, 123);
    var d = new Date();
    
    var cNight = "rgba(0,0,60,1)";
    var cDay = "rgba(200,200,200,0.9)";
    var cText = "rgba(100,100,100,0.9)";
    
    var fontsize = 10;
    var linewidth = "3.0";
    var ic = 240;
    var cx = 110;
    var cy = 110;
    var rad = 80;
    var trad = rad + 14;
    var offset = -d.getTimezoneOffset() / 60;
    
    var canvas = document.getElementById("daylightometer");
    
    //var myLocation = new SunriseSunset( 2011, 0, 9, 67.8, 27); 
    var myLocation = new SunriseSunset( d.getFullYear(), d.getMonth()+1, d.getDate()+1, geoip_latitude(), geoip_longitude());
    
    var riseHour = myLocation.sunriseLocalHours(offset);
    var setHour = myLocation.sunsetLocalHours(offset);
    
    // Solstice workaround
    if (isNaN(riseHour))
	riseHour = 0.00;
    if (isNaN(setHour))
	setHour = 0.00;
    
    var dayLenH = Math.floor(setHour - riseHour);
    var dayLenM = Math.round(60 * ((setHour - riseHour) % 1));
    var dayLen = dayLenH + ":" + zeroPad(dayLenM, 2);
    
    var night = 24.0 - (setHour - riseHour);
    var nightLenH = Math.floor(night);
    var nightLenM = Math.round(60 * (night % 1));
    var nightLen = nightLenH + ":" + zeroPad(nightLenM, 2);
    
    if (canvas.getContext) {
	var ctx = canvas.getContext("2d");
	ctx.font = "" + fontsize + "pt Arial";
	ctx.lineWidth = linewidth;

	// Print debug info
	ctx.fillStyle = cText;
	ctx.fillText(d, ic, 20);
	ctx.fillText("Sunrise " + hourstr(riseHour), ic, 35);
	ctx.fillText("Sunset " + hourstr(setHour), ic, 50);
	ctx.fillText("Coordinates " + geoip_latitude() + ", " + geoip_longitude(), ic, 65);
	ctx.fillText("Offset " + -d.getTimezoneOffset() / 60 , ic, 80);
	ctx.fillText("Day lenght " + dayLen , ic, 95);
	ctx.fillText("Night lenght " + nightLen , ic, 110);
	
	// Nighttime sector
	ctx.fillStyle = cNight;
	ctx.beginPath();
	ctx.arc(cx, cy, rad + 3,0, Math.PI * 2, true);
	ctx.closePath();
	ctx.fill(); 
	
	// Daytime sector
	ctx.fillStyle = cDay;
	ctx.beginPath();
	ctx.moveTo(cx, cy);
	if (mode == 12) {
	    // 12 hour display, ante meridiem
	    if (d.getHours() < 12)
		ctx.arc(cx, cy, rad, hour2rad(0, mode), hour2rad(riseHour, mode), true);
	    // 12 hour display, post meridiem
	    else
		ctx.arc(cx, cy, rad,hour2rad(setHour, mode), hour2rad(0, mode), true);
	}
	// 24 hour display
	else
	    ctx.arc(cx, cy, rad,hour2rad(setHour, mode), hour2rad(riseHour, mode), true);
	ctx.lineTo(cx,cy);
	ctx.closePath();
	ctx.fill(); 

	// Print day and night length
	var tmprad;
	if (mode == 12) {
	    if (d.getHours() < 12)
		tmpRad = 0.5 * (hour2rad(0, mode) + hour2rad(riseHour, mode));
	    else
		tmpRad = -Math.PI / 4 + 0.5 * (hour2rad(setHour, mode));
	}
	else
	    tmpRad = 0.5 * (hour2rad(setHour, mode) + hour2rad(riseHour, mode));

	var dlx = cx + (trad / 2) * Math.cos(tmpRad) - (fontsize / 2);
	var dly = cy + (trad / 2) * Math.sin(tmpRad) + (fontsize / 2);
	var nlx = cx + (trad / 2) * Math.cos(tmpRad + Math.PI) - (fontsize / 2);
	var nly = cy + (trad / 2) * Math.sin(tmpRad + Math.PI) + (fontsize / 2);

	ctx.fillStyle = cNight;
	ctx.fillText(dayLen, dlx-fontsize, dly);
	ctx.fillStyle = cDay;
	ctx.fillText(nightLen, nlx-fontsize, nly);
	
	// Clock hand
	ctx.beginPath();      
	ctx.moveTo(cx, cy);
	var hour = d.getHours() + d.getMinutes() / 60;
	ctx.lineTo(cx + rad * Math.cos(hour2rad(hour, mode)), cy + rad * Math.sin(hour2rad(hour, mode)));
	ctx.strokeStyle = "rgba(255,0,0,0.5)";
	ctx.stroke();
	ctx.closePath();
	
	// Print hour tics
	ctx.fillStyle = cText;
	var start = 1;
	var end = 24;
	if (mode == 12) {
	    if (d.getHours() > 12)
		start += 12;
	    else
		end /= 2;
	}
	for (i=start; i<=end; i++) {
	    var tmpx = cx + trad * Math.cos(hour2rad(i, mode)) - (fontsize / 2);
	    var tmpy = cy + trad * Math.sin(hour2rad(i, mode)) + (fontsize / 2);
	    ctx.fillText(i, tmpx, tmpy);
	}  
    }
}
