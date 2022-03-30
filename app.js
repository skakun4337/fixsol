/**
 * Two array constants that connect the names of the venues in the tool's interface
 * with the names of the files corresponding to the venues.
 */
const VENUES = ["Training Fields", "Woodland Path", "Scorched Forest", "Sandswept Delta", "Blooming Grove",
                "Forgotten Cave", "Bamboo Falls", "Thunderhead Savanna", "Redrock Cove", "Waterway", "Arena",
                "Volcanic Vents", "Rainsong Jungle", "Boreal Wood", "Crystal Pools", "Harpy's Roost",
                "Ghostlight Ruins", "Mire", "Kelp Beds", "Golem Workshop", "Forbidden Portal"];
const FILEPATHS = ["trainingfields", "woodlandpath", "scorchedforest", "delta", "grove",
                "forgottencave", "bamboofalls", "savanna", "cove", "waterway", "arena",
                "vents", "jungle", "borealwood", "pools", "roost",
                "ruins", "mire", "kelpbeds", "workshop", "portal"];

/**
 * A pair of helper functions that allow the tool to load data from
 * the included data files.
 */
async function readFile(filePath) {
    let response = await fetch(filePath);
    if (response.ok) {
        return response.text();
    } else console.log("Could not find " + filePath);
}
async function readJSON(filePath) {
    let response = await fetch(filePath);
    if (response.ok) {
        return response.json();
    } else console.log("Could not find " + filePath);
}

/**
 * This tool uses a JavaScript tool called Vue to quickly bind variables and set listeners.
 * All functions that are set as listeners, as well as their variable dependencies,
 * are declared inside the Vue object.
 **/
const App = new Vue ({
    /**
     * "el" is a required field in any Vue object. It refers to an element in the HTML
     * where the entire app must be contained. Vue's HTML syntax extensions will only work
     * inside this containing element.
     */
    el: "#app",

    /**
     * All mutable variables that the Vue functions depend on are declared in the "data" object.
     * Some of them are automatically bound to inputs in the interface, just like the functions.
     * This dramatically cuts down the lines of code needed in the JavaScript in order to wire up
     * these variables with the HTML.
     *
     * (also yes i know i don't name my variables well i coded half this stuff after midnight
     * be nice to me)
     */
    data: {
        addType: "",
        venues: VENUES,
        dragons: [],
        monsters: [],
        encounters: [],
        encounter: [],
        newDragon: {
            name: null,
            quickness: 0,
            numAmbush: 0,
        },
        newMonster: {
            name: null,
            quickness: 0,
        },
        turnsCalculated: false,
        numRounds: null,
        turns: [],
        loadedMonsters: [],
    },

    /**
     * These variables automatically calculate valid monsters based on the user's
     * already chosen monsters in the Encounter dropdowns. They declared in the "computed"
     * object, meaning Vue automatically recalculates them whenever their dependencies
     * ("encounters" and "encounter") change.
     */
    computed: {
        firstMonsters() {
            let monsters = this.encounters.map(ms => ms[0]);
            return monsters.filter((m, i) => monsters.findIndex(mon => mon === m) === i && m).sort();
        },
        secondMonsters() {
            return this.encounters.map(ms => {
                if (ms.length > 1 && ms[0] === this.encounter[0]) return ms[1];
            }).filter((m, i, array) => array.findIndex(mon => mon === m) === i && m).sort();
        },
        thirdMonsters() {
            return this.encounters.map(ms => {
                if (ms.length > 2 && ms[0] === this.encounter[0] && ms[1] === this.encounter[1]) return ms[2];
            }).filter((m, i, array) => array.findIndex(mon => mon === m) === i && m).sort();
        },
        fourthMonsters() {
            return this.encounters.map(ms => {
                if (ms.length > 3 && ms[0] === this.encounter[0] && ms[1] === this.encounter[1] && ms[2] === this.encounter[2]) return ms[3];
            }).filter((m, i, array) => array.findIndex(mon => mon === m) === i && m).sort();
        },
        isValidEncounter() {
            return this.encounters.some(enc => enc.toString() === this.encounter.toString());
        },
    },

    /**
     * All methods that are bound to some input in the tool's interface. Vue's HTML
     * syntax extension allows them to be bound to any HTML element without having to declare
     * a listener in the JavaScript. Most of them are declared asynchronous to prevent the
     * whole page from freezing if the tool runs into a fatal bug.
     */
    methods: {
        /**
         * Functions to manage the dragons declared in the tool. The "newDragon" object
         * they depend on is automatically two-way bound to several inputs in the tool's
         * interface by Vue, so they can be used here without having to set listeners for them.
         */
        async addDragon() {
            this.dragons.push({
                name: this.newDragon.name,
                quickness: parseInt(this.newDragon.quickness),
                ambush: parseInt(this.newDragon.numAmbush),
                initiative: 0,
            });
            this.newDragon.name = null;
            this.newDragon.quickness = null;
            this.newDragon.numAmbush = 0;
        },
        async deleteDragon(dragon) {
            let index = this.dragons.findIndex(d => d === dragon);
            this.dragons.splice(index, 1);
        },

        /**
         * Similarly to the dragon functions above, these functions manage monsters added
         * by the user. Since there are multiple ways to add monsters, there are multiple
         * functions that add monsters based on different inputs.
         */
        async addCustomMonster() {
            this.monsters.push({
                name: this.newMonster.name,
                quickness: parseInt(this.newMonster.quickness),
                initiative: 0,
            });
            this.newMonster.name = null;
            this.newMonster.quickness = null;
        },
        async addMonster(name, quickness) {
            this.monsters.push({
                name: name,
                quickness: parseInt(quickness),
                initiative: 0,
            });
        },
        async deleteMonster(monster) {
            let index = this.monsters.findIndex(m => m === monster);
            this.monsters.splice(index, 1);
        },

        /**
         * This function updates the "encounter" variable and is called whenever the user
         * selects a monster to add to the encounter. It seems wasteful to create a new array
         * for this function, but in this case, it is necessary because the "computed" functions
         * above will only recalculate variables when their dependencies are explicitly redefined
         * to bind to new values. Simply changing a value in the array itself will not trigger
         * these necessary recalculations.
         */
        async setEncounter(index, monster) {
            let newArray = this.encounter.filter(m => true);
            newArray[index] = monster;
            this.encounter = newArray;
            },

        /**
         * Adds the new encounter using the addMonster function above. Because the button
         * that triggers this function is only visible when the encounter is valid, there is
         * no need to check the loaded encounters inside the function. However, it will fail
         * if one or more of the selected monsters are not found in the venue's monster data,
         * in which case I have made a mistake and would be eternally grateful if you reported
         * this in the forum thread.
         */
        async addEncounter() {
            this.monsters = [];
            this.encounter.forEach(m => {
                let monsterData = this.loadedMonsters.find(mon => mon.name === m)
                if (!monsterData) console.log("ERROR: Could not find data for " + m.name +
                                                " in loaded venue");
                else this.addMonster(monsterData.name, monsterData.quickness);
            });
            this.encounter = [];
        },

        /**
         * The function that calculates the turn order based on the selected dragons and
         * monsters. This is where the bulk of the tool's essential logic is contained.
         * If there is a discrepancy between the calculated turn order and what you observe
         * in the Coli, the issue is most likely in here somewhere. Please let me know if you
         * encounter problems with the turn order calculation logic!
         */
        async calculateTurns() {
            if (this.numRounds > 50) {
                console.log("Max 50 rounds allowed");
                return;
            }
            this.turns = [];

            for (let dragon of this.dragons) {
                if (dragon.ambush > 0) this.turns.push(dragon.name);
                if (dragon.ambush > 1) this.turns.push(dragon.name);
            }

            if (this.monsters.length === 0) return;

            let turncost = this.monsters[this.monsters.length - 1].quickness;

            let combatants = [];
            this.dragons.forEach(d => {
                d.initiative = 0;
                combatants.push(d);
            });
            this.monsters.forEach(m => {
                m.initiative = 0;
                combatants.push(m);
            });

            for (let i = 0; i < this.numRounds; i++) {
                combatants.forEach(c => c.initiative += c.quickness);

                let maxBreath = turncost;
                while (maxBreath >= turncost) {
                    let c = combatants[0];
                    combatants.forEach(combatant => {
                        if (combatant.initiative > c.initiative) c = combatant;
                    });
                    maxBreath = c.initiative;
                    if (c.initiative >= turncost) {
                        this.turns.push(c.name);
                        c.initiative -= turncost;
                    }
                }
            }

            this.turnsCalculated = true;
        },

        /**
         * Functions that load monster data based on the venue that is selected. They use
         * Papa Parse to automatically parse monster data, since that data is stored in CSV files.
         * Encounter data is stored as JSON, so Papa is not necessary for them.
         */
        async loadMonsters(venue) {
            let index = VENUES.findIndex(v => v === venue);
            let csv = await readFile("monsterdata/" + FILEPATHS[index] + ".csv");
            this.loadedMonsters = await Papa.parse(csv, {header: true, skipEmptyLines: true}).data;
        },
        async loadEncounters(venue) {
            let index = VENUES.findIndex(v => v === venue);
            this.encounters = await readJSON("encounters/" + FILEPATHS[index] + ".json");
            await this.loadMonsters(venue);
        },
    }
});
