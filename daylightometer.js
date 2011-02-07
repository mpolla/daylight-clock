function hour2rad(hour, mode) {
    if (mode == 12) {
	if (12 <= hour) {
	    hour = hour - 12;
	}
	return -Math.PI/2 + (hour/12.0)*Math.PI*2;
    }
    return -Math.PI/2 + (hour/24.0)*Math.PI*2;
}


function dom12h() {
    return daylightometer(12);
}

function dom24h() {
    return daylightometer(24);
}

function zeroPad( number, width)
{
  width -= number.toString().length;
  if ( width > 0 )
  {
    return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
  }
  return number;
}


function daylightometer(mode) {
    
    //var d = new Date(2010, 5, 20, 17, 37, 33, 123);
    var d = new Date();
    
    var cNight = "rgba(0,0,60, 1)";
    var cDay = "rgba(200,200,200, 0.9)";
    
    var cx = 200;
    var cy = 160;
    var rad = 80;
    var trad = rad+14;
    var offset = -d.getTimezoneOffset()/60;
    
    var canvas = document.getElementById("daylightometer");
    
    //var myLocation = new SunriseSunset( 2010, 5, 20, 70, 27); 
    var myLocation = new SunriseSunset( d.getFullYear(), d.getMonth()+1, d.getDate()+1, geoip_latitude(), geoip_longitude());
    
    var riseHour = myLocation.sunriseLocalHours(offset);
    var setHour = myLocation.sunsetLocalHours(offset);
    
    var dayLenH = Math.floor(setHour - riseHour);
    var dayLenM = Math.floor(60 * (setHour - riseHour)%1);
    var dayLen = dayLenH + ":" + zeroPad(dayLenM,2);
    
    var nightLenH = Math.floor(24 - (setHour - riseHour));
    var nightLenM = Math.floor(60 - (60 * (setHour - riseHour)%1));
    var nightLen = nightLenH + ":" + zeroPad(nightLenM,2)
	
	if (canvas.getContext) {
	    var ctx = canvas.getContext("2d");
	    
	    // Show info
	    ctx.fillStyle = "rgb(100,100,100)";
	    ctx.fillText  (d, 10, 20);
	    ctx.fillText  ("Sunrise " + myLocation.sunriseLocalHours(offset), 10, 35);
	    ctx.fillText  ("Sunset " + myLocation.sunsetLocalHours(offset), 10, 50);
	    ctx.fillText  ("Coordinates " + geoip_latitude() + ", " + geoip_longitude() , 10, 65);
	    ctx.fillText  ("Offset " + -d.getTimezoneOffset()/60 , 10, 80);
	    ctx.fillText  ("Day lenght " + dayLen , 10, 95);
	    ctx.fillText  ("Night lenght " + nightLen , 10, 110);
	    
	    // Night
	    ctx.fillStyle = cNight;
	    ctx.beginPath();
	    ctx.arc(cx,cy,rad+3,0,Math.PI*2,true);
	    ctx.closePath();
	    ctx.fill(); 
	    
	    // Day
	    
	    if (mode == 12) {
		ctx.fillStyle = cDay;
		ctx.beginPath();
		
		// 12 hour display, ante meridiem
		if (d.getHours() < 12) {
		    ctx.moveTo(cx,cy);
		    ctx.arc(cx,cy,rad,hour2rad(0,mode),hour2rad(riseHour,mode),true);
		    ctx.lineTo(cx,cy);
		    
		}
		// 12 hour display, post meridiem
		else {
		    ctx.moveTo(cx,cy);
		    ctx.arc(cx,cy,rad,hour2rad(setHour,mode),hour2rad(0,mode),true);
		    ctx.lineTo(cx,cy);
		    
		    
		}
		ctx.closePath();
		ctx.fill(); 
	    }
	    // 24 hour display
	    else {
		ctx.fillStyle = "rgba(200,200,200, 0.9)";
		ctx.beginPath();
		ctx.moveTo(cx,cy);
		ctx.arc(cx,cy,rad,hour2rad(setHour,mode),hour2rad(riseHour,mode),true);
		ctx.lineTo(cx,cy);
		ctx.closePath();
		ctx.fill();
	    }
	    
	    // Print day and night length
	    if (mode == 12) {
		if (d.getHours() < 12) {
		    ctx.fillStyle = cNight;
		    var tmpRad = 0.5 * (hour2rad(0,mode) + hour2rad(riseHour,mode));
		    ctx.fillText  (dayLen, cx+(trad/2)*Math.cos(tmpRad)-5, cy+(trad/2)*Math.sin(tmpRad)+4);
		    ctx.fillStyle = cDay;
		    ctx.fillText  (nightLen, cx+(trad/2)*Math.cos(tmpRad + Math.PI)-5, cy+(trad/2)*Math.sin(tmpRad + Math.PI)+4);
		}
		else {
		    ctx.fillStyle = cNight;
		    var tmpRad = -Math.PI/4 + 0.5 * (hour2rad(setHour,mode));
		    ctx.fillText  (dayLen, cx+(trad/2)*Math.cos(tmpRad)-5, cy+(trad/2)*Math.sin(tmpRad)+4);
		    ctx.fillStyle = cDay;
		    ctx.fillText  (nightLen, cx+(trad/2)*Math.cos(tmpRad + Math.PI)-5, cy+(trad/2)*Math.sin(tmpRad + Math.PI)+4);
		}
	    }
	    else {
		ctx.fillStyle = cNight;
		var tmpRad = 0.5 * (hour2rad(setHour,mode) + hour2rad(riseHour,mode));
		ctx.fillText  (dayLen, cx+(trad/2)*Math.cos(tmpRad)-5, cy+(trad/2)*Math.sin(tmpRad)+4);
		ctx.fillStyle = cDay;
		ctx.fillText  (nightLen, cx+(trad/2)*Math.cos(tmpRad + Math.PI)-5, cy+(trad/2)*Math.sin(tmpRad + Math.PI)+4);
	    }
	    
	    
	    // Clock arm
	    
	    
	    
	    
	    
	    ctx.fillStyle = "rgba(200,0,0, 0.86)";
	    
	    ctx.beginPath();      
	    ctx.moveTo(cx, cy);
	    var hour = d.getHours()+d.getMinutes()/60;
	    ctx.lineTo(cx + rad * Math.cos(hour2rad(hour,mode)) , cy + rad * Math.sin(hour2rad(hour,mode)) );
	    ctx.strokeStyle = "rgba(255,0,0,0.5)";
	    ctx.stroke();
	    ctx.closePath();
	    
      
      // Clock numbers
      ctx.fillStyle = "rgb(80,80,80)";
      var start=1;
      var end=24;
      if (mode == 12) {
	  if (d.getHours() > 12) {
	      start = 13;
	      end = 24;
	  }
	  else {
	      end = 12;
	  }
      }
	    for (i=start; i<=end; i++) {
		ctx.fillText  (i, cx+trad*Math.cos(hour2rad(i,mode))-5, cy+trad*Math.sin(hour2rad(i,mode))+4);
	    }	  
	    
	    
	}
}
