/*
 * Copyright (c) 2018.
 * Github - Shibdib
 * Name - Bob Sardinia
 * Project - Overlord-Bot (Screeps)
 */

let highCommand = require('military.highCommand');

Creep.prototype.siegeGroupRoom = function () {
    let sentence = [ICONS.respond];
    let word = Game.time % sentence.length;
    this.say(sentence[word], true);
    // Set squad leader
    if (!this.memory.squadLeader || !this.memory.leader || !Game.getObjectById(this.memory.leader)) {
        let squadLeader = _.filter(Game.creeps, (c) => c.memory && c.memory.targetRoom === this.memory.targetRoom && c.memory.operation === 'siegeGroup' && c.memory.squadLeader);
        if (!squadLeader.length && this.memory.role === 'breacher') this.memory.squadLeader = true; else if (squadLeader.length) this.memory.leader = squadLeader[0].id;
    }
    // Handle squad leader
    if (this.memory.squadLeader) {
        // Sustainability
        if (this.room.name === this.memory.targetRoom) highCommand.operationSustainability(this.room);
        highCommand.threatManagement(this);
        //levelManager(this);
        // Handle border
        if (this.borderCheck()) return;
        // Check for squad
        let squadMember = _.filter(this.room.creeps, (c) => c.memory && c.memory.targetRoom === this.memory.targetRoom && c.memory.operation === this.memory.operation && c.id !== this.id);
        if (!squadMember.length) return this.handleMilitaryCreep(false, false);
        if (this.pos.findInRange(squadMember, 2).length < squadMember.length) return this.idleFor(1);
        // If military action required do that
        if (this.handleMilitaryCreep(false, false)) return;
        // Heal
        if (this.hits < this.hitsMax) this.heal(this);
        // Move to response room if needed
        if (this.room.name !== this.memory.targetRoom) return this.shibMove(new RoomPosition(25, 25, this.memory.targetRoom), {range: 22});
        if (!this.shibMove(new RoomPosition(25, 25, this.memory.targetRoom), {range: 17})) return this.idleFor(5);
    } else {
        // Set leader and move to them
        let leader = Game.getObjectById(this.memory.leader);
        if (!leader) return delete this.memory.leader;
        if (this.room.name === leader.room.name) {
            let moveRange = 0;
            let ignore = true;
            if (this.pos.x === 0 || this.pos.x === 49 || this.pos.y === 0 || this.pos.y === 49 || this.pos.getRangeTo(leader) > 1) {
                moveRange = 1;
                ignore = false;
            }
            this.shibMove(leader, {range: moveRange, ignoreCreeps: ignore});
        } else {
            this.shibMove(new RoomPosition(25, 25, leader.room.name), {range: 23});
        }
        // Heal squadmates
        let squadMember = _.filter(this.room.creeps, (c) => c.memory && c.memory.targetRoom === this.memory.targetRoom && c.memory.operation === 'siegeGroup' && c.id !== this.id);
        // Heal squad
        let woundedSquad = _.filter(squadMember, (c) => c.hits < c.hitsMax && c.pos.getRangeTo(this) === 1);
        if (this.hits === this.hitsMax && woundedSquad[0]) this.heal(woundedSquad[0]); else if (this.hits < this.hitsMax) this.heal(this);
        this.attackInRange();
    }
};

function levelManager(creep) {
    if (!Memory.targetRooms[creep.memory.targetRoom]) return;
    let enemyCreeps = _.filter(creep.room.creeps, (c) => !_.includes(FRIENDLIES, c.owner.username));
    let towers = _.filter(creep.room.structures, (c) => c.structureType === STRUCTURE_TOWER && c.energy > 10);
    let armedEnemies = _.filter(enemyCreeps, (c) => c.getActiveBodyparts(ATTACK) || c.getActiveBodyparts(RANGED_ATTACK));
    if (towers.length) {
        delete Memory.targetRooms[creep.memory.targetRoom];
        let cache = Memory.targetRooms || {};
        let tick = Game.time;
        cache[creep.room.name] = {
            tick: tick,
            type: 'scout',
        };
        Memory.targetRooms = cache;
        return;
    }
    if (armedEnemies.length) {
        Memory.targetRooms[creep.memory.targetRoom].level = 2;
    } else if (enemyCreeps.length) {
        Memory.targetRooms[creep.memory.targetRoom].level = 1;
    } else {
        Memory.targetRooms[creep.memory.targetRoom].level = 0;
    }
}