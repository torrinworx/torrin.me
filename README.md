# TODO:
- Possilby stream line backend and instead of streaming low/high images just show a suspend with loading dots until each image is loaded, maybe pre send the images dimensions to reserve space and build out a skeleton component div to take up the space of the images before they load:
```
const image = ({each}) => <div theme='center' style={{ width: each.width, height each.height}}>
    <LoadingDots >
</div>;
```
so basically get ride of the caching and reconsyliation system and the lazy loading approach.

- look into light weight 3d model viewer and interactor to display a 3d modal somewhere

- Just have a dropdown with all the sections of my website in a hamburger menu list instead of using tabs. Use titles like Photography, Git Projects, About (default/landing with all resume stuff).

- backend scrapes git regularly to show latest github projects, stared personal projects are the ones to show off, only show them, show them in order they were last committed to.

- convert collision from old website back and place it only on the about page. or make it so that it can be turned off/on depending on the page. so that say the Photography page doesn't have it on

- In each image in the photography page, make it so that you can click on it, expand it to a full screen view with an X escape button. The full screen image viewer will show image info 
like the camera make and model, and lens and capture info iso/f stop/shutter speed and other cool stuff we can think of like histogram, editing software, photo name/description
(lookup how to enter description and name of images in darktable), see how to possibly display and link geo coordinates of images to google maps.
