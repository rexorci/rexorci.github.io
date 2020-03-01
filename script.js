$(window).on('orientationchange', function (e) {
    location.reload();
});

document.addEventListener("keyup", function (event) {
    if (event.defaultPrevented) {
        return;
    }

    var key = event.key || event.keyCode;

    if (key === "Escape" || key === "Esc" || key === 27) {
        $("#country_details").hide();
    }
});


function details_close() {
    $("#country_details").hide();
    $("#invisible_div").hide();
}

function init_countries() {
    let spreadsheet_url = "https://docs.google.com/spreadsheets/d/1ekFxb2alTcKRRemIsXoG8Un41cRW4q19HC4iEstOs7U/pubhtml";
    Tabletop.init({
        key: spreadsheet_url,
        callback: set_country_data,
        simpleSheet: true
    })
}
let country_dicts = {}
function set_country_data(data) {
    country_dicts = data;
    color_countries();
    calculate_statistc();
}


function color_countries() {
    for (let i in country_dicts) {
        let country_div = document.getElementById(country_dicts[i].Country);
        if (country_dicts[i].Read == "Read") {
            country_div.style.fill = "#a2f89f";
        } else if (country_dicts[i].Read == "Wanted") {
            country_div.style.fill = "#fae77c";
        } else {
            country_div.style.fill = "#ffd9d9";
        }
    }
}

function init_touch_controls() {
    let eventsHandler = {
        haltEventListeners: ['touchstart', 'touchend', 'touchmove', 'touchleave', 'touchcancel']
        , init: function (options) {
            var instance = options.instance
                , initialScale = 1
                , pannedX = 0
                , pannedY = 0

            // Init Hammer
            // Listen only for pointer and touch events
            this.hammer = Hammer(options.svgElement, {
                inputClass: Hammer.SUPPORT_POINTER_EVENTS ? Hammer.PointerEventInput : Hammer.TouchInput
            })

            // Enable pinch
            this.hammer.get('pinch').set({ enable: true })

            // Handle double tap
            this.hammer.on('doubletap', function (ev) {
                instance.zoomIn()
            })

            // Handle pan
            this.hammer.on('panstart panmove', function (ev) {
                // On pan start reset panned variables
                if (ev.type === 'panstart') {
                    pannedX = 0
                    pannedY = 0
                }

                // Pan only the difference
                instance.panBy({ x: ev.deltaX - pannedX, y: ev.deltaY - pannedY })
                pannedX = ev.deltaX
                pannedY = ev.deltaY
            })

            // Handle pinch
            this.hammer.on('pinchstart pinchmove', function (ev) {
                // On pinch start remember initial zoom
                if (ev.type === 'pinchstart') {
                    initialScale = instance.getZoom()
                    instance.zoomAtPoint(initialScale * ev.scale, { x: ev.center.x, y: ev.center.y })
                }

                instance.zoomAtPoint(initialScale * ev.scale, { x: ev.center.x, y: ev.center.y })
            })

            // Prevent moving the page on some devices when panning over SVG
            options.svgElement.addEventListener('touchmove', function (e) { e.preventDefault(); });
        }

        , destroy: function () {
            this.hammer.destroy()
        }
    }
    return eventsHandler
}

$(document).ready(function () {
    // Add the same function to all path elements
    $('path').click(function () {
        on_country_click(event, this.id);
    });
    init_countries();


    // Initialize Zooming Function
    customEventsHandler = init_touch_controls();
    zoomer = svgPanZoom('#map', {
        controlIconsEnabled: !isMobileDevice(),
        zoomScaleSensitivity: 0.3,
        minZoom: 1,
        maxZoom: 40,
        onUpdatedCTM: details_close,
        customEventsHandler: customEventsHandler
    });

    let map_svg = document.getElementById('map');
    let map_width = map_svg.getBoundingClientRect()['width'];
    let map_height = map_svg.getBoundingClientRect()['height'];
    let init_zoom = map_svg.createSVGPoint();
    init_zoom.x = map_width * 0.5;
    init_zoom.y = map_height * 0.45;
    aspect_ratio = map_height / map_width;
    zoom_grade = 5 * aspect_ratio;

    zoomer.zoomAtPoint(zoom_grade, init_zoom, false);

});

function set_star_rating(star_rating) {
    // TODO only works for the first country with a rating
    let rating = parseInt(star_rating) || 0;
    let rating_div = document.getElementById("rating_div");
    let stars = rating_div.getElementsByTagName("span")

    for (i = 0; i < rating; i++) {
        stars[i].classList.remove("fa-star-o")
        stars[i].classList.add("fa-star")
    }
    for (i = rating; i < 5; i++) {
        stars[i].classList.remove("fa-star")
        stars[i].classList.add("fa-star-o")
    }
}

function get_country_dict(country_name) {
    // TODO Check if page fully loaded
    for (let i in country_dicts) {
        if (country_dicts[i].Country == country_name) {
            return country_dicts[i];
        }
    }
    return null;
}

function on_country_click(e, country_id) {
    // Information from DOM Elements
    let left = parseInt( e.clientX );
    let top = parseInt(e.clientY );
    // let left = e.clientX + "px";
    // let top = e.clientY + "px";
    let country_details = document.getElementById("country_details");
    let country = document.getElementById(country_id);

    let country_name_text = country.getElementsByTagName("title")[0].textContent;
    let country_name = document.getElementById("country_name");


    // Fill Country Summary
    country_name.textContent = country_name_text;
    country_dict = get_country_dict(country_id);
    book_title.textContent = country_dict.Title;
    book_author.textContent = country_dict.Author;
    book_summary_text.textContent = country_dict.Description;
    book_cover.src = country_dict.Thumbnail;
    set_star_rating(country_dict.Rating);

    // Load again so that height/weight represent the most recent content!
    country_details = document.getElementById("country_details");
    div_width = parseInt( getComputedStyle(country_details).width);
    div_height =  parseInt(getComputedStyle(country_details).height);

    max_width = parseInt(window.innerWidth);
    max_height = parseInt(window.innerHeight);
    

    // Reset position to appear at Mouse Cursor
    if (div_width + left < max_width) {
        country_details.style.left = left + "px";
    } else {
        country_details.style.left = max_width - div_width - 5 + "px" ;
    }
    if (div_height + top < max_height) {
        country_details.style.top = top + "px";
    } else {
        country_details.style.top = max_height -div_height - 5 + "px";
    }

    $("#country_details").show();
    $("#invisible_div").show();
    return false;
}

function calculate_statistc() {
    let total = country_dicts.length;

    let read = 0;
    let planned = 0;
    let open = 0;
    for (let i in country_dicts) {
        if (country_dicts[i].Read == "Read") {
            read++;
        } else if (country_dicts[i].Read == "Wanted") {
            planned++;
        }
        else {
            open++;
        }
    }

    let statistic_total = document.getElementById("statistic_total");
    let statistic_read = document.getElementById("statistic_read");
    let statistic_planned = document.getElementById("statistic_planned");
    let statistic_open = document.getElementById("statistic_open");

    statistic_total.innerHTML = `${total} Total`;
    statistic_read.innerHTML = `${read} Read`;
    statistic_planned.innerHTML = `${planned} Planned`;
    statistic_open.innerHTML = `${open} Open`;
}


function isMobileDevice() {
    let isMobile = (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
    return isMobile
};