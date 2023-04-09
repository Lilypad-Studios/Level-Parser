let data;
let exp;
let fr = new FileReader();
let str1 = "games.rednblack.editor.renderer.data.SimpleImageVO";
let str2 = "games.rednblack.editor.renderer.data.CompositeItemVO";
let str3 = "games.rednblack.editor.renderer.data.LabelVO"

// Represents the player. 
let player;

// Represents the resources.
let resources;

// Represents the spikes.
let spikes = [];

// Spike offset.
let offset = [[0,0], [100, 0], [100, 100], [0, 100]];

// Represents the platforms.
let platforms = [];

// Represents the number of platforms.
let size = 0;

// Represents the cooldown.
let cooldown;

// Represents the meteor probabilities.
let meteor_probabilities;


fr.onload = () => {
    data = JSON.parse(fr.result);
    let simples = data.composite.content[str1];
    let composites = data.composite.content[str2];
    let constants = data.composite.content[str3];

    // Gets player.
    player = simples.filter(e => e.itemIdentifier == "Player")[0];

    // Gets cooldown.
    cooldown = constants[0]?.customVariables.CD ?? 0;

    // Gets meteor probabilities.
    meteor_probabilities = {
        "random_meteor_probability": constants[0]?.customVariables.RMP ?? 0,
        "targeted_meteor_probability": constants[0]?.customVariables.TMP ?? 0,
        "homing_meteor_probability": constants[0]?.customVariables.HMP ?? 0
    }

    // Gets resources.
    resources = simples.filter(e => e.itemIdentifier == "Resource").map((e) => {
        return {
            "pos": [((e.x ?? 0) + 50)/100, ((e.y ?? 0) + 50)/100],
            "angle": (e.rotation ?? 0) * (Math.PI/180),
            "rotation_center" : [16 + (e.customVariables.CX ?? 0)/100, 9 + (e.customVariables.CY ?? 0)/100],
            "rotation_velocity": e.customVariables.AV ?? 0
        };
    });

    // Gets spikes with composites.
    composites.filter(e => e.itemIdentifier.includes("PlatSpike")).map((e) => {
        let a1 = (e.rotation ?? 0) * (Math.PI/180);
        let [c1, s1] = [Math.cos(a1), Math.sin(a1)];

        // Push platforms to be parsed.
        platforms.push(...e.content[str2].map((el) => {
            let x = (el.x ?? 0) * c1 - (el.y ?? 0) * s1 + (e.x ?? 0);
            let y = (el.x ?? 0) * s1 + (el.y ?? 0) * c1 + (e.y ?? 0);
            el.x = x;
            el.y = y;
            el.rotation = e.rotation ?? 0;
            el.customVariables = {};
            el.customVariables.CX = e.customVariables.CX;
            el.customVariables.CY = e.customVariables.CY;
            el.customVariables.AV = e.customVariables.AV;
            return el;
        }));

        // Parse and return spikes.
        e.content[str1].map((s) => {
            let spikeAngle = (s.rotation ?? 0);
            spikeAngle = spikeAngle < 0 ? 360 + spikeAngle : spikeAngle;
            let x = (((s.x ?? 0) + offset[spikeAngle/90][0]) * c1 - ((s.y ?? 0) + offset[spikeAngle/90][1]) * s1 + (e.x ?? 0)) / 100;
            let y = (((s.x ?? 0) + offset[spikeAngle/90][0]) * s1 + ((s.y ?? 0) + offset[spikeAngle/90][1]) * c1 + (e.y ?? 0)) / 100;
            let angle = a1 + spikeAngle*(Math.PI/180);
            let [cos, sin] = [Math.cos(angle), Math.sin(angle)]; 
            spikes.push({
                "points": [x, y, x + cos, y + sin, 0.5*cos - 0.75*sin + x, 0.5*sin + 0.75*cos + y],
                "rotation_center": [16 + e.customVariables.CX/100, 9 + e.customVariables.CY/100],
                "rotation_velocity": e.customVariables.AV,
                "texture": "black"
            });
        });
    });

    // Gets the spikes within PlatGroups.
    composites
        .filter(composite => composite.itemIdentifier.includes("PlatGroup"))
        .map((platGroup) => {
            let a1 = (platGroup.rotation ?? 0) * (Math.PI/180);
            let [c1, s1] = [Math.cos(a1), Math.sin(a1)];

            // Push platforms to be parsed.
            platforms.push(...platGroup.content[str2].filter((plat) => plat.itemIdentifier.includes("Platform")).map((e) => {
                let x = (e.x ?? 0) * c1 - (e.y ?? 0) * s1 + (platGroup.x ?? 0);
                let y = (e.x ?? 0) * s1 + (e.y ?? 0) * c1 + (platGroup.y ?? 0);
                e.x = x;
                e.y = y;
                e.rotation = (e.rotation ?? 0) + (platGroup.rotation ?? 0);
                e.customVariables = {};
                e.customVariables.CX = platGroup.customVariables.CX;
                e.customVariables.CY = platGroup.customVariables.CY;
                e.customVariables.AV = platGroup.customVariables.AV;
                return e;
            }));
            platGroup.content[str2].filter((plat) => plat.itemIdentifier.includes("PlatSpike")).map((platSpike) => {
                // Push platforms to be parsed.
                platforms.push(...platSpike.content[str2].map((e) => {
                    let x = ((e.x ?? 0) + (platSpike.x ?? 0)) * c1 - ((e.y ?? 0) + (platSpike.y ?? 0)) * s1 + (platGroup.x ?? 0);
                    let y = ((e.x ?? 0) + (platSpike.x ?? 0)) * s1 + ((e.y ?? 0) + (platSpike.y ?? 0)) * c1 + (platGroup.y ?? 0); 
                    e.x = x;
                    e.y = y;
                    e.rotation = (e.rotation ?? 0) + (platGroup.rotation ?? 0);
                    e.customVariables = {};
                    e.customVariables.CX = platGroup.customVariables.CX;
                    e.customVariables.CY = platGroup.customVariables.CY;
                    e.customVariables.AV = platGroup.customVariables.AV;
                    return e;
                }));

                // Parse and return spikes.
                platSpike.content[str1].map((s) => {
                    let spikeAngle = (s.rotation ?? 0);
                    spikeAngle = spikeAngle < 0 ? 360 + spikeAngle : spikeAngle;
                    let x = (((s.x ?? 0) + (platSpike.x ?? 0) + offset[spikeAngle/90][0]) * c1 - ((s.y ?? 0) + (platSpike.y ?? 0) + offset[spikeAngle/90][1]) * s1 + (platGroup.x ?? 0)) / 100;
                    let y = (((s.x ?? 0) + (platSpike.x ?? 0) + offset[spikeAngle/90][0]) * s1 + ((s.y ?? 0) + (platSpike.y ?? 0) + offset[spikeAngle/90][1]) * c1 + (platGroup.y ?? 0)) / 100;
                    let angle = a1 + (s.rotation ?? 0)*(Math.PI/180);
                    let [cos, sin] = [Math.cos(angle), Math.sin(angle)]; 
                    spikes.push({
                        "points": [x, y, x + cos, y + sin, 0.5*cos - 0.75*sin + x, 0.5*sin + 0.75*cos + y],
                        "rotation_center": [16 + platGroup.customVariables.CX/100, 9 + platGroup.customVariables.CY/100],
                        "rotation_velocity": platGroup.customVariables.AV,
                        "texture": "black"
                    });
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
            "rotation_center": [16 + e.customVariables.CX/100, 9 + e.customVariables.CY/100],
            "rotation_velocity": e.customVariables.AV
        };
    });

    // Represents the level.
    exp = {
        "level" : {
            "player": [0.5 + (player.x ?? 0)/100, 0.5 + (player.y ?? 0)/100],
            "resources": resources,
            "size": size,
            "cooldown": cooldown,
            "meteor_probabilities": meteor_probabilities,
            "platforms": platforms,
            "stationary_hazards": spikes,
            "lava_hazards": []
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