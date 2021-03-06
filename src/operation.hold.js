let highCommand = require('military.highCommand');

Creep.prototype.holdRoom = function () {
    let sentence = ['This', 'Room', 'Has', 'Been', 'Marked', 'For', 'Other', 'Uses', 'Please', 'Abandon'];
    let word = Game.time % sentence.length;
    this.say(sentence[word], true);
    if (this.memory.role === 'longbow') {
        // Set squad leader
        if (!this.memory.squadLeader || !this.memory.leader || !Game.getObjectById(this.memory.leader)) {
            let squadLeader = _.filter(Game.creeps, (c) => c.memory && c.memory.targetRoom === this.memory.targetRoom && c.memory.operation === 'hold' && c.memory.squadLeader && c.memory.role === 'longbow');
            if (!squadLeader.length) this.memory.squadLeader = true; else this.memory.leader = squadLeader[0].id;
        }
        let squadMember = _.filter(this.room.creeps, (c) => c.memory && c.memory.targetRoom === this.memory.targetRoom && c.memory.operation === 'hold' && c.id !== this.id && c.memory.role === 'longbow');
        // Handle squad leader
        if (this.memory.squadLeader) {
            // Sustainability
            if (this.room.name === this.memory.targetRoom) highCommand.operationSustainability(this.room);
            highCommand.threatManagement(this);
            levelManager(this);
            // Request unClaimer if room level is too high
            if (this.room.name === this.memory.targetRoom && Memory.targetRooms[this.room.name]) Memory.targetRooms[this.room.name].unClaimer = !this.room.controller.upgradeBlocked && (!this.room.controller.ticksToDowngrade || this.room.controller.level > 1 || this.room.controller.ticksToDowngrade > this.ticksToLive);
            // If military action required do that
            if (this.handleMilitaryCreep(false, false)) return;
            // Handle border
            if (this.borderCheck()) return;
            // Check for squad
            if (!squadMember.length || this.pos.getRangeTo(squadMember[0]) > 1) return this.idleFor(1);
            // Heal squad
            let woundedSquad = _.filter(squadMember, (c) => c.hits < c.hitsMax && c.pos.getRangeTo(this) === 1);
            if (this.hits === this.hitsMax && woundedSquad[0]) this.heal(woundedSquad[0]); else if (this.hits < this.hitsMax) this.heal(this);
            // Move to response room if needed
            if (this.room.name !== this.memory.targetRoom) return this.shibMove(new RoomPosition(25, 25, this.memory.targetRoom), {range: 22});
            if (!this.shibMove(new RoomPosition(25, 25, this.memory.targetRoom), {range: 17})) return this.idleFor(5);
        } else {
            // Set leader and move to them
            let leader = Game.getObjectById(this.memory.leader);
            if (this.room.name === leader.room.name) this.shibMove(leader, {range: 0}); else this.shibMove(new RoomPosition(25, 25, leader.room.name), {range: 23});
            // Heal squadmates
            let woundedSquad = _.filter(squadMember, (c) => c.hits < c.hitsMax && c.pos.getRangeTo(this) === 1);
            if (this.hits === this.hitsMax && woundedSquad[0]) this.heal(woundedSquad[0]); else if (this.hits < this.hitsMax) this.heal(this);
            this.attackInRange();
        }
    } else if (this.memory.role === 'unClaimer') {
        if (this.room.name !== this.memory.targetRoom) return this.shibMove(new RoomPosition(25, 25, this.memory.targetRoom), {range: 22});
        if (this.room.controller.upgradeBlocked > this.ticksToLive) this.memory.recycle = true;
        switch (this.attackController(this.room.controller)) {
            case OK:
                if (!this.memory.signed) {
                    let signs = ATTACK_ROOM_SIGNS;
                    this.signController(this.room.controller, _.sample(signs));
                    this.memory.signed = true;
                }
                break;
            case ERR_NOT_IN_RANGE:
                this.shibMove(this.room.controller, {range: 1});
                break;
        }
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