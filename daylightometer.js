function clockrad(hour) {
    return -Math.PI/2 + (hour/24.0)*Math.PI*2;
}

function daylightometer() {
    
    var d = new Date();       
    var cx = 200;
    var cy = 160;
    var rad = 80;
    var trad = rad+10;
    var offset = -d.getTimezoneOffset()/60;
    
    var canvas = document.getElementById("tutorial");
    
      //var myLocation = new SunriseSunset( 2011, 1, 19, 35+40/60, 139+45/60); 
    var myLocation = new SunriseSunset( d.getFullYear(), d.getMonth()+1, d.getDate()+1, geoip_latitude(), geoip_longitude());

      var riseHour = myLocation.sunriseLocalHours(offset);
      var setHour = myLocation.sunsetLocalHours(offset);

      if (canvas.getContext) {
      var ctx = canvas.getContext("2d");
      
      // Show date
      ctx.fillStyle = "rgb(100,100,100)";
      ctx.fillText  (d, 80, 20);
      ctx.fillText  ("Sunrise " + myLocation.sunriseLocalHours(offset), 80, 35);
      ctx.fillText  ("Sunset " + myLocation.sunsetLocalHours(offset), 80, 50);
      ctx.fillText  ("Coordinates " + geoip_latitude() + ", " + geoip_longitude() , 80, 65);
      ctx.fillText  ("Offset " + -d.getTimezoneOffset()/60 , 80, 80)
      
      //ctx.fillStyle = "rgb(200,0,0)";
      //ctx.fillRect (10, 10, 55, 50);
      
      // Night
      ctx.fillStyle = "rgba(0,0,60, 1)";
      ctx.beginPath();
      ctx.arc(cx,cy,rad+3,0,Math.PI*2,true);
      ctx.closePath();
      ctx.fill(); 

      // Day
      ctx.fillStyle = "rgba(200,200,200, 0.9)";
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,rad,clockrad(setHour),clockrad(riseHour),true);
      ctx.lineTo(cx,cy);
      ctx.closePath();
      ctx.fill(); 

      // Clock arm
      ctx.fillStyle = "rgba(200,0,0, 0.86)";
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      var hour = d.getHours()+d.getMinutes()/60;
      ctx.arc(cx,cy,rad,clockrad(hour),clockrad(hour)-0.05,true);
      ctx.lineTo(cx,cy);
      ctx.closePath();
      ctx.fill(); 
      

      // Clock numbers
      ctx.fillStyle = "rgb(180,0,160)";
      var i=0;
      for (i=0; i<24; i++) {
	  ctx.fillText  (i, cx+trad*Math.cos(clockrad(i)), cy+trad*Math.sin(clockrad(i)));
      }
      
      }
}
