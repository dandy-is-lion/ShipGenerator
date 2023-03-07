var statsData;
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function () {
	if (this.readyState == 4 && this.status == 200) {
		statsData = JSON.parse(this.responseText);
	}
};
xhttp.open("GET", "./src/data.json", true);
xhttp.send();
