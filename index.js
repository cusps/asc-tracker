let map;
var kmlLayer;

let race_site = "https://worldsolarchallenge.org/"

var team_markers = {};
var first_load = true;

const vehicle_icons = [];

const marker_svg_path = "M 0 -6 L -5 6 L 0 3 L 5 6 Z";

const marker_svg_egg_path = "M 3.12 -3.28 C 2.24 -4.88 1.04 -5.84 -0.08 -5.84 S -2.4 -4.96 -3.28 -3.28 C -4 -1.92 -4.56 -0.24 -4.56 1.04 C -4.56 2.24 -4.08 3.44 -3.28 4.24 C -2.4 5.12 -1.28 5.6 -0.08 5.6 S 2.24 5.12 3.12 4.24 C 3.92 3.36 4.4 2.24 4.4 1.04 C 4.4 -0.16 3.92 -1.92 3.12 -3.28 Z Z"
const eggshell_color = "#f0e4d6"//"#F0EAD6";
const eggshell_thickness = 2;

var mn_follow_count = 0;
const mn_follow_thresh = 5;

const generic_icon = {

    // path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,

    path: marker_svg_path,
    scale: 2,
    strokeWeight: 2,
    strokeColor: "#000000",
    fillOpacity: 0.8,
};


// All legend stuff.
var legend;
var legend_heading;
var legend_heading_height;
var legend_idx;

function legend_click() {
    legend.open = !legend.open;
    if (legend.open == true) {
        legend.style.maxHeight = "45%"
        legend.style.minHeight = legend_heading_height * 1.5 + "px";
        legend.style.height = "auto"
        legend.style.overflowY = "auto";
        legend_heading.classList.remove("legend_hover")
        legend_heading.style.color = "black"
    }
    else {
        legend_heading.style.color = "dimgray"
        legend_heading.classList.add("legend_hover")
        legend.style.maxHeight = null
        legend.style.minHeight = null;
        legend.style.height = legend_heading_height / 2 + "px";
        legend.style.overflowY = "hidden";
    }

}

function init_legend() {

    legend = document.getElementById("legend");
    legend_heading = document.getElementById("legend_heading");
    legend_heading.onclick = legend_click
    legend_heading_height = legend_heading.clientHeight;
    legend.style.height = legend_heading_height / 2 + "px";

    for (const legend_icon of vehicle_icons) {
        const type = legend_icon;
        const name = type.name;
        const icon = type.icon;
        const div = document.createElement("div");

        div.innerHTML = '<img src="' + icon + '"> ' + name;
        legend.appendChild(div);
    }

    legend_idx = map.controls[google.maps.ControlPosition.LEFT_TOP].getLength();
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(legend);

}

function add_to_lengend(svg_marker, name, teamnum, team_marker) {
    const legend = map.controls[google.maps.ControlPosition.LEFT_TOP].getAt(legend_idx);

    const div = document.createElement("div");


    div.appendChild(svg_marker)
    const text = document.createElement("text");
    text.innerHTML = name
    text.style.userSelect = "none"
    div.appendChild(text)

    div.onclick = get_marker_click_callback(teamnum, div);
    div.title = "Follow Vehicle"
    div.style.cursor = "pointer"
    team_marker.legend_div = div

    // console.log(div.innerHTML)

    legend.appendChild(div);
    // vehicle_icons.push(icon);
}

// initialize the map and kick things off.
async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    var src = 'https://developers.google.com/maps/documentation/javascript/examples/kml/westcampus.kml';

    // Create map and set center.
    // return { lat: 38.890248, lng: -94.609152 }
    map = new Map(document.getElementById("map"), {
        center: { lat: -24.1308539, lng: 134.3255761 },
        zoom: 5,
        streetViewControl: false,
    });


    init_legend();


    const asc = document.getElementById("race_logo");
    race_logo.style.cursor = "pointer";
    race_logo.onclick = function () { window.open(race_site) };
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(race_logo);


    var kmlLayer = new google.maps.KmlLayer("https://cusps.github.io/solar-car-tracker/wsc2023_route.kml", {
        suppressInfoWindows: true,
        preserveViewport: false,
        map: map
    });


}


initMap();


function make_team_marker(team) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    svg.setAttribute("stroke", "black")
    svg.setAttribute("stroke-width", "1")
    svg.setAttribute("stroke-linecap", "round")
    svg.setAttribute("stroke-linejoin", "round")
    svg.setAttribute("width", "24px")
    svg.setAttribute("height", "24px")
    svg.setAttribute("viewBox", "-6 -7 14 14")
    svg.setAttribute("id", "marker")

    path.setAttribute('d', marker_svg_path);
    path.setAttribute('fill', team['color']);

    svg.appendChild(path);

    return svg;
}

var vehicle_following = null;

function unfollow_marker(marker_key) {
    team_markers[marker_key].legend_div.title = "Follow Vehicle"
    team_markers[marker_key].legend_div.style.background = ""
}

/* Function factory that stores closure to specific marker. */
function get_marker_click_callback(marker_key, div) {
    return function () {
        if (vehicle_following == marker_key) {
            vehicle_following = null;
            unfollow_marker(marker_key, div);
        }
        else {
            if (vehicle_following != null) {
                unfollow_marker(vehicle_following);
            }
            vehicle_following = marker_key
            div.title = "Unfollow Vehicle"
            div.style.background = "LightGray"
            set_map_to_team(marker_key)
            if (team_markers[marker_key]["title"] == "35 Minnesota") {
                mn_follow_count++;
            }
            if (mn_follow_count == mn_follow_thresh) {
                set_egg(team_markers[marker_key])
            }
        }
    }
}

/* Function factory that stores closure to specific marker. */
function get_marker_click_callback_info_window(marker_key) {
    return function () {
        team_markers[marker_key].info_window.open({
            anchor: team_markers[marker_key],
            map,
            shouldFocus: false,
        });

        google.maps.event.addListenerOnce(map, "click", function (event) {
            team_markers[marker_key].info_window.close();
        });

    }
}


function get_team_loc(team) {
    const loc = new google.maps.LatLng(team["latitude"], team["longitude"]);
    return loc;
}

function new_team_marker(team, teamnum) {
    var team_icon = generic_icon;
    team_icon.fillColor = "blue" //team['color']
    var legend_icon = team_icon;
    team_icon.rotation = 0; //parseInt(team['course'])
    console.log('Team: ' + team['team']); // + ', Color: ' + team_icon.fillColor)
    var number = team['teamnum']
    if (isNaN(number)) { number = "" }
    var team_marker = new google.maps.Marker({
        position: get_team_loc(team),
        map: map,
        title: team['team'],
        // label: {
        //     text: number,
        //     color: 'black',
        //     fontSize: "8px"
        // },
        icon: team_icon,
    });

    team_marker.info_window = new google.maps.InfoWindow({ content: team["team"] + "<br />" + team["status"], disableAutoPan: true })


    // Gotta figure out how to get the actual SVG from this icon.
    add_to_lengend(make_team_marker(team), team['team'], teamnum, team_marker)


    team_marker.addListener("click", get_marker_click_callback_info_window(teamnum));

    return team_marker;
}

function is_online(team) {
    return true; //team["deltatime"] < online_threshold;
}

function set_team_online(marker, team) {
    /* Look at time since last datapoint (in seconds) */
    const online = is_online(team);

    const legend_children = marker.legend_div.children;

    var legend_icon;

    for (var i = 0; i < legend_children.length; i++) {
        if (legend_children[i].id == "marker") {
            legend_icon = legend_children[i];
        }
    }

    if (!online) {
        marker.icon.fillOpacity = 0.5;
        marker.icon.strokeWeight = 0.0;
        legend_icon.style.fillOpacity = 0.5;
        legend_icon.setAttribute("stroke-width", 0.0);
    }
    else {
        marker.icon.fillOpacity = generic_icon.fillOpacity;
        marker.icon.strokeWeight = generic_icon.strokeWeight;
        legend_icon.style.fillOpacity = generic_icon.fillOpacity;
        legend_icon.setAttribute("stroke-width", 1);
    }
}

function set_team_rotation(marker, team) {
    var icon = marker.getIcon();
    icon.rotation = 0 //parseInt(team['course']);
    marker.setIcon(icon);
}

function set_map_to_team(team_key) {
    const team = team_markers[team_key].team_data;
    map.setCenter(get_team_loc(team));
}

function set_egg(marker) {


    const legend_children = marker.legend_div.children;

    var legend_icon_egg;

    for (i = 0; i < legend_children.length; i++) {
        if (legend_children[i].id == "marker") {
            legend_icon_egg = legend_children[i];
        }
    }

    marker.icon.path = marker_svg_egg_path;
    marker.icon.fillColor = eggshell_color;

    var icon_path = legend_icon_egg.children[0];
    // console.log(legend_icon_egg)
    // console.log(icon_path)
    icon_path.setAttribute("d", marker_svg_egg_path)
    icon_path.setAttribute("fill", eggshell_color)

    marker.title = "35 EGG"
}

function onGetPositionsComplete(data) {
    console.log("onGetPositionsComplete");

    data = data["items"]

    var bounds = new google.maps.LatLngBounds();
    var bounds_count = 0;


    for (const team of data) {
        let teamnum = Number(team["teamnum"])

        if (!(teamnum in team_markers)) {
            team_markers[teamnum] = new_team_marker(team, teamnum);
            team_markers[teamnum].teamnum = teamnum
        }
        else {
            team_markers[teamnum].setPosition(get_team_loc(team));
            set_team_rotation(team_markers[teamnum], team)
            team_markers[teamnum].info_window.setContent(team["team"] + "<br />Distance from Darwin: " + team["distance"] + "mi.")
        }

        team_markers[teamnum].team_data = team;

        set_team_online(team_markers[teamnum], team)

        if (first_load && is_online(team) && team["team"] != "EMT") {
            bounds_count = bounds_count + 1;
            bounds.extend(team_markers[teamnum].getPosition())
        }

        if (vehicle_following != null && vehicle_following == teamnum) {
            set_map_to_team(teamnum)
        }

    }

    if (first_load) {
        first_load = false;
        console.log(bounds_count)

        if (bounds_count >= 2) {
            map.setCenter(bounds.getCenter())
            map.fitBounds(bounds);
        }
        else {
            // TODO: idk what this shit does.
            function on_stat_change() {
                console.log("status changed")
                console.log(ctaLayer.getDefaultViewport());
                map.fitBounds(ctaLayer.getDefaultViewport())
            }
            if (ctaLayer.getDefaultViewport() == null) {
                google.maps.event.addListenerOnce(ctaLayer, "defaultviewport_changed", on_stat_change);
            }
            else {
                on_stat_change();
            }
        }

    }
    setTimeout(getPositions, delay);
}

function getPositions() {
    $.ajax({
        url: 'https://telemetry.worldsolarchallenge.org/wscearth/api/positions',
        dataType: 'json',
        async: true,
        crossDomain: true,
    }).done(onGetPositionsComplete);
}

getPositions();

