$(document).ready(function() {
    $("[class=toolImg]").tooltip();
    $("[title^=header\\=]").tooltip({type: "html"});
    $("[class^=toolTxt]").tooltip({type: "tooltip"});
});
