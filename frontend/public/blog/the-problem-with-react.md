# header
The problem with React and MUI

# description
For the past year I've been working on a project that started as an internal tool at my job as a web dev at Equator Studios, the project has made me realize that there is a big problem with the way modern js libraries like Material UI are built for developers.




For the past year I've been working on a project that started as an internal tool at my job as a web dev at Equator Studios, the project has made me realize that there is a big problem with the way modern js libraries like Material UI are built for developers.

Using Material UI is fairly burdensome for many reasons, the package size, it's reliance on react and the performance issues that introduces with the virtual dom, a quite horribly disorganized theme system, and the general resistance to customization one faces when trying to tweak anything about any component.

Basically, if you don't want to ride their carefully designed rollercoaster the way they intended, seatbelt, bubble wrap and all, you are simply out of luck or face a heap of challenges and wasted time.

Generally the problems with MUI and most modern JavaScript projects (React is another good example of this) can be distilled: They suffer from expanding complexity creep.

```javascript
const theme = createTheme({
  ...
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
  },
});
```

This complexity creep leads to an increase in confusion among new developers both arriving to material ui, or to the js ecosystem at large for the first time.

As someone who's first experience with web development was manually creating html/css/js templates in Django, the React/MUI ecosystem really warped and altered my understanding of web development into a gooie mess. React intro tutorials never teach you about the "dom" or how js is used to physically update html dom elements in a literal .html file.

That concept was never communicated to me, not through code, not through the documentation, not even through third party tutorials on how to use these tools. They hand you the hammer and blabber something about nails while kicking you out the door, and thus I never had an understand of how the elements on the page were actually structured, rendering, updating, or reacting.

This reveals another major issue with MUI and React: the complexity creep abstracts the need for basic understanding of the tools your using; the browser, the dom, css, and JavaScript itself.

How did I wake up you ask? That's simple, I work with a senior developer who insists on building almost everything ourselves. We have our own websocket implementation, our own base64 encoder hard coded into our backend, files and files of complex projection math to render gis data.

This persistent pursuit to create almost everything our selves has two main benefits over using off the shelf solutions: Everything is easily tweakable to our companies needs, and we are able to learn the fundamentals of any problem we tackle, improving our skills as developers.

Remember that theme definition in MUI above? This it in destamatic-ui:
```javascript
const theme = {
    button: {
	    borderRadius: '8px'
    },
};
```

That's it, a simple object with key `button`, the css class name, the value of which is a style object converted into inline css in the dom when that class is invoked. dead simple. All that's needed to define a global theme. This can even be duplicated and used in another `ThemeContext` in the same app.

This approach brings convenience without cluttering the page with ten different parameters and objects you need to declare because it will break if you don't for some reason you can read about in the documentation or on their github issues pages when it breaks.

The themeing system in our ui library destamatic-ui is quite advanced, it has inheritance, so you can reuse styles, variables and functions so you can create reactive themes:
```javascript
$alpha: (c, amount) => {
	let [r, g, b] = color(c);
	return color.toCSS([r, g, b, parseFloat(amount)]);
},
$color: '#FF0000'
...
<div style={{ background: '$alpha($color, 0.5)'}} />
```

That's not all though. destamatic-ui is built on two other libraries that have this same no complex nonsense approach: destam, a delta state management library, and destam-dom, a dom manipulation library built on destam's observer reactivity.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/wq09nfx40z0o12q3o506.png)

Why is destam-dom better and simply faster? destam-dom doesn't use a virtual dom, it doesn't re-render the entire page on an update. It directly modifies the dom, and the specific element of the dom a given component actually needs to update. Which means it doesn't require the entire page to be reloaded whenever there is even the smallest of updates.

{% embed https://torrin.me %}

I built my personal site [torrin.me](https://torrin.me) using our destam stack, my site was originally built with React, React-Three-Fiber, and MUI. I cannot tell you how buttery smooth the loading is now, the theme transitions, the snappy reactivity. Using destam-dom simplified my build pipeline, made deployments 40 seconds.

Working with the destam stack professionally has not only inspired me to build my hobby projects using it but has also deepened my understanding of how websites function. By embracing a more efficient, back-to-basics approach, I've learned to create web applications that are lean, efficient, and snappily reactive. I firmly believe that if more developers adopt this approach to libraries and frameworks, it could lead to a healthier ecosystem for newcomers to learn and create.

If you're tired of the complexity and ready to experience the difference, I encourage you to give the destam stack a try. We've dedicated ourselves to crafting tools that prioritize both developer and user comfort. You can explore the stack and see for yourself:

- [destamatic-ui](https://github.com/torrinworx/destamatic-ui)
- [destam-dom](https://github.com/Nefsen402/destam-dom)
- [destam](https://github.com/equator-studios/destam)

Join us in creating more efficient and enjoyable web experiences!

---

This was just a brief introduction to destam, destam-dom, and destamatic-ui. I'll be writing more in depth articles and tutorials about the stack, and some adjacent projects I've been working on using it to show it off. Please let me know what you think!