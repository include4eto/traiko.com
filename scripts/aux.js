// random normal variable
async function randn() {
    var res = await tf.randomNormal([1,1], mean=0, stddev=1).data()
    return Array.from(res)[0]
}

function pauseEvent(e){
    if(e.stopPropagation) e.stopPropagation();
    if(e.preventDefault) e.preventDefault();
    e.cancelBubble=true;
    e.returnValue=false;
    return false;
}

function deselect(e) {
    pauseEvent(e);
    if (document.selection) {
        document.selection.empty()
    } else {
        window.getSelection().removeAllRanges()
    }
}

ko.bindingHandlers.slider = {
    init: function(element, valueAccessor) {
        var $element = $(element);
        var $inner = $element.find('.slider-inner'),
            isDragging = false,
            elOffset = $element.offset().left,
            elWidth = $element.width(),
            innerWidth = $inner.width(),
            minVal = 0, maxVal = 100,
            minOffset = elOffset, maxOffset = elWidth + elOffset - innerWidth;

        var value = valueAccessor();

        // initial value setup
        initialX = (value() / (maxVal - minVal)) * (maxOffset - minOffset) + minOffset;
        $inner.offset({
            left: initialX
        });

        function moveTo(event) {
            elOffset = $element.offset().left;
            elWidth = $element.width();
            innerWidth = $inner.width();
            minOffset = elOffset;
            maxOffset = elWidth + elOffset - innerWidth;

            var mouseX = event.pageX;
            if (mouseX < minOffset) mouseX = minOffset;
            if (mouseX > maxOffset) mouseX = maxOffset;

            $inner.offset({
                left: mouseX
            });

            var frac = (mouseX - minOffset) / (maxOffset - minOffset);

            value(
                (maxVal - minVal) * frac
            );
        }

        $element.click((event) => {
            moveTo(event);
        });

        $inner.mousedown((event) => {
            isDragging = true;
        });

        $(window).mouseup((event) => {
            isDragging = false;
        });

        $(window).mousemove((event) => {
            if (isDragging) {
                moveTo(event);

                // disable selection on the page[
                deselect(event);
                return false;
            }
        });
    }
};