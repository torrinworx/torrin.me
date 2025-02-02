import { ODB } from "../destam-web-core/common";

// function that loads, then keeps track of updating the images list of data.
const images = async () => {
    const list = await ODB('mongodb', 'images', {'name': 'images'})

}

export default images;
