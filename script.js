let data;
let fr = new FileReader();

// Represents the player. 
let player;

// Represents the resources.
let resources;

// Represents the spikes.
let spikes = [];

// Represents the platforms.
let platforms = [];

// Represents the number of platforms.
let size = 0;

// Represetns the cooldown.
let cooldown;

fr.onload = () => {
    data = JSON.parse(fr.result);
    let simples = data.composite.content["games.rednblack.editor.renderer.data.SimpleImageVO"];
    let composites = data.composite.content["games.rednblack.editor.renderer.data.CompositeItemVO"];

    // TODO: Add player to level json so that this gets added to the level.
    player = simples.filter(e => e.imageName == "player")[0];

    // Gets cooldown.
    cooldown = composites.filter(e => e.customVariables.CD != undefined)[0]?.customVariables.CD ?? 100;

    // Gets resources.
    resources = simples.filter(e => e.imageName.includes("resource")).map((e) => {
        return {
            "pos": [(e.x + 50)/100, (e.y + 50)/100],
            "angle": (e.rotation ?? 0) * (Math.PI/180),
            "rotation_center" : [e.customVariables.CX/100, e.customVariables.CY/100],
            "rotation_velocity": e.customVariables.AV
        };
    });

    // Gets spikes.
    composites.filter(e => e.itemIdentifier.includes("PlatSpike")).map((e) => {
        platforms.push(...e.content["games.rednblack.editor.renderer.data.CompositeItemVO"].map((el) => {
            el.x = e.x ?? 0;
            el.y = e.y ?? 0;
            el.rotation = e.rotation ?? 0;
            el.customVariables.CX = e.customVariables.CX;
            el.customVariables.CY = e.customVariables.CY;
            el.customVariables.AV = e.customVariables.AV;
            return el;
        }));
        e.content["games.rednblack.editor.renderer.data.SimpleImageVO"].map((s) => {
            let a1 = (e.rotation ?? 0) * (Math.PI/180);
            let [c1, s1] = [Math.cos(a1), Math.sin(a1)];
            let x = ((s.x ?? 0) * c1 - (s.y ?? 0) * s1 + (e.x ?? 0)) / 100;
            let y = ((s.x ?? 0) * s1 + (s.y ?? 0) * c1 + (e.y ?? 0)) / 100;
            let angle = a1 + (s.rotation ?? 0)*(Math.PI/180);
            let [cos, sin] = [Math.cos(angle), Math.sin(angle)]; 
            spikes.push({
                "points": [x, y, x + cos, y + sin, 0.5*cos - 0.75*sin + x, 0.5*sin + 0.75*cos + y],
                "rotation_center": [e.customVariables.CX/100, e.customVariables.CY/100],
                "rotation_velocity": e.customVariables.AV,
                "texture": "black"
            });
        });
    });

    // Gets platforms.
    platforms = [...composites.filter(el => el.itemIdentifier.includes("Platform")), ...platforms].map((e) => {
        let rotation = (e.rotation ?? 0) * (Math.PI/180);
        let [cos, sin] = [Math.cos(rotation), Math.sin(rotation)];
        let [x, y] = [(e.x ?? 0)/100, (e.y ?? 0)/100];
        let [h, w] = [e.height/100, e.width/100];
        size++;
        return {
            "island": [
                [x - h*sin, y + h*cos, x, y, x + w*cos, y + w*sin, x - h*sin + w*cos, y + h*cos + w*sin]
            ],
            "rotation_center": [e.customVariables.CX/100, e.customVariables.CY/100],
            "rotation_velocity": e.customVariables.AV
        };
    });

    // Represents the level.
    let exp = {
        "level" : {
            "player": [(player.x ?? 0)/100 + 0.5, (player.y ?? 0/100) + 0.5],
           "resources": resources,
           "size": size,
           "cooldown": cooldown,
           "platforms": platforms,
           "stationary_hazards": spikes
        }
    };

    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exp, null, 4));
    let dlAnchorElem = document.getElementById('downloadAnchorElem');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "level.json");
}

document.getElementById('inputfile').onchange = (e) => {
    fr.readAsText(e.target.files[0]);
}