module.exports.processBuildQueue = function () {
    let spawns = Game.spawns;
    for (let key in spawns) {
        let spawn = spawns[key];
        let level = getLevel(spawn.room);
        if (!spawn.spawning) {
            if (spawn.room.memory.creepBuildQueue) {
                let topPriority = _.min(spawn.room.memory.creepBuildQueue, 'importance');
                let role = topPriority.role;
                let body;
                if (topPriority.reboot) {
                    body = _.get(SPAWN[1], role);
                } else {
                    body = _.get(SPAWN[level], role);
                }
                if (topPriority && typeof topPriority === 'object') {
                    _.defaults(topPriority, {
                        role: undefined,
                        overlord: undefined,
                        assignedSource: undefined,
                        destination: undefined,
                        assignedMineral: undefined,
                        military: undefined,
                        responseTarget: undefined,
                        targetRoom: undefined,
                        operation: undefined,
                        siegePoint: undefined,
                        staging: undefined,
                        waitForHealers: undefined,
                        waitForAttackers: undefined,
                        waitForRanged: undefined,
                        waitForDeconstructor: undefined,
                        reservationTarget: undefined,
                        initialBuilder: undefined
                    });
                    if (!topPriority.role) return;
                    if (spawn.spawnCreep(body, role + Game.time, {
                            memory: {
                                born: Game.time,
                                role: role,
                                overlord: topPriority.overlord,
                                assignedSource: topPriority.assignedSource,
                                destination: topPriority.destination,
                                assignedMineral: topPriority.assignedMineral,
                                military: topPriority.military,
                                responseTarget: topPriority.responseTarget,
                                targetRoom: topPriority.targetRoom,
                                operation: topPriority.operation,
                                siegePoint: topPriority.siegePoint,
                                staging: topPriority.staging,
                                waitForHealers: topPriority.waitForHealers,
                                waitForAttackers: topPriority.waitForAttackers,
                                waitForRanged: topPriority.waitForRanged,
                                waitForDeconstructor: topPriority.waitForDeconstructor,
                                reservationTarget: topPriority.reservationTarget,
                                initialBuilder: topPriority.initialBuilder
                            }
                        }) === OK) {
                        log.i(spawn.room.name + ' Spawning a ' + role);
                        return delete spawn.room.memory.creepBuildQueue;
                    } else {
                        spawn.room.visual.text('Queued - ' +
                            _.capitalize(topPriority.role),
                            spawn.pos.x + 1,
                            spawn.pos.y,
                            {align: 'left', opacity: 0.8}
                        );
                    }
                }
            }
        } else {
            let spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text(
                ICONS.build + ' ' + spawningCreep.name,
                spawn.pos.x + 1,
                spawn.pos.y,
                {align: 'left', opacity: 0.8}
            );
        }
    }
};

function queueCreep(room, importance, options = {}) {
    let cache = room.memory.creepBuildQueue || {};
    if (!room.memory.creepBuildQueue) room.memory.creepBuildQueue = {};
    _.defaults(options, {
        role: undefined,
        overlord: undefined,
        assignedSource: undefined,
        destination: undefined,
        assignedMineral: undefined,
        responseTarget: undefined,
        targetRoom: undefined,
        operation: undefined,
        siegePoint: undefined,
        staging: undefined,
        waitForHealers: undefined,
        waitForAttackers: undefined,
        waitForRanged: undefined,
        waitForDeconstructor: undefined,
        reservationTarget: undefined,
        initialBuilder: undefined,
        reboot: undefined
    });
    if (room) {
        let key = options.role;
        cache[key] = {
            cached: Game.time,
            room: room.name,
            importance: importance,
            role: options.role,
            overlord: room.name,
            assignedSource: options.assignedSource,
            destination: options.destination,
            assignedMineral: options.assignedMineral,
            responseTarget: options.responseTarget,
            targetRoom: options.targetRoom,
            operation: options.operation,
            siegePoint: options.siegePoint,
            staging: options.staging,
            waitForHealers: options.waitForHealers,
            waitForAttackers: options.waitForAttackers,
            waitForRanged: options.waitForRanged,
            waitForDeconstructor: options.waitForDeconstructor,
            reservationTarget: options.reservationTarget,
            initialBuilder: options.initialBuilder,
            reboot: options.reboot
        };
        if (!room.memory.creepBuildQueue[key]) room.memory.creepBuildQueue = cache;
    }
}

function getLevel(room) {
    let energy = room.energyCapacityAvailable;
    if (energy >= RCL_1_ENERGY && energy < RCL_2_ENERGY) {
        return 1;
    } else if (energy >= RCL_2_ENERGY && energy < RCL_3_ENERGY) {
        return 2
    } else if (energy >= RCL_3_ENERGY && energy < RCL_4_ENERGY) {
        return 3
    } else if (energy >= RCL_4_ENERGY && energy < RCL_5_ENERGY) {
        return 4
    } else if (energy >= RCL_5_ENERGY && energy < RCL_6_ENERGY) {
        return 5
    } else if (energy >= RCL_6_ENERGY && energy < RCL_7_ENERGY) {
        return 6
    } else if (energy >= RCL_7_ENERGY && energy < RCL_8_ENERGY) {
        return 7
    } else if (energy >= RCL_8_ENERGY) {
        return 8
    }
}

function roomStartup(room, roomCreeps) {
    let harvesters = _.filter(roomCreeps, (c) => (c.memory.role === 'stationaryHarvester' || c.memory.role === 'basicHarvester'));
    if (harvesters.length < 2) {
        queueCreep(room, 1, {
            role: 'stationaryHarvester'
        })
    }
    let pawn = _.filter(roomCreeps, (creep) => (creep.memory.role === 'getter' || creep.memory.role === 'filler' || creep.memory.role === 'hauler' || creep.memory.role === 'pawn' || creep.memory.role === 'basicHauler'));
    let containers = _.filter(room.structures, (s) => s.structureType === STRUCTURE_CONTAINER)
    if (pawn.length < 2 && containers.length > 0) {
        queueCreep(room, 2, {
            role: 'hauler'
        })
    }
    let worker = _.filter(roomCreeps, (creep) => (creep.memory.role === 'worker'));
    if (worker.length < 2) {
        queueCreep(room, 3, {
            role: 'worker'
        })
    }
    let upgrader = _.filter(roomCreeps, (creep) => (creep.memory.role === 'upgrader'));
    if (upgrader.length < 5) {
        queueCreep(room, 4, {
            role: 'upgrader'
        })
    }
    let explorers = _.filter(roomCreeps, (creep) => creep.memory.role === 'explorer');
    if (explorers.length < 1) {
        queueCreep(room, 5, {
            role: 'explorer'
        })
    }
}

function neighborCheck(spawnRoom, remoteRoom) {
    return Game.map.getRoomLinearDistance(spawnRoom, remoteRoom) <= 1;
}

module.exports.workerCreepQueue = function (room) {
    let queue = room.memory.creepBuildQueue;
    let level = getLevel(room);
    let energy = room.energyAvailable;
    let roomCreeps = _.filter(Game.creeps, (r) => r.memory.overlord === room.name);
    // Level 1 room management
    if (level === 1) {
        roomStartup(room, roomCreeps);
    }
    //Harvesters
    let harvesters = _.filter(roomCreeps, (c) => (c.memory.role === 'stationaryHarvester'));
    if (harvesters.length === 0) {
        room.memory.creepBuildQueue = undefined;
        queueCreep(room, -1, {
            role: 'stationaryHarvester',
            reboot: true
        });
        return;
    }
    if (!_.includes(queue, 'stationaryHarvester')) {
        if (harvesters.length < 2 || (harvesters[0].ticksToLive < 100 && harvesters.length < 3)) {
            queueCreep(room, PRIORITIES.stationaryHarvester, {
                role: 'stationaryHarvester'
            })
        }
    }
    //Upgrader
    if (!_.includes(queue, 'upgrader') && level === room.controller.level && !room.memory.responseNeeded) {
        let upgraders = _.filter(roomCreeps, (creep) => creep.memory.role === 'upgrader');
        if (upgraders.length < _.round((9 - level) / 2)) {
            queueCreep(room, PRIORITIES.upgrader, {
                role: 'upgrader'
            })
        }
    }
    //Worker
    if (!_.includes(queue, 'worker') && room.constructionSites.length > 0 && !room.memory.responseNeeded) {
        let workers = _.filter(roomCreeps, (creep) => creep.memory.role === 'worker');
        if (workers.length < 2) {
            queueCreep(room, PRIORITIES.worker, {
                role: 'worker'
            })
        }
    }
    //Haulers
    let hauler = _.filter(roomCreeps, (creep) => (creep.memory.role === 'hauler'));
    if (hauler.length === 0 && energy <= 350) {
        room.memory.creepBuildQueue = undefined;
        queueCreep(room, PRIORITIES.hauler, {
            role: 'hauler',
            reboot: true
        });
        return;
    }
    if (!_.includes(queue, 'hauler')) {
        let hauler = _.filter(roomCreeps, (creep) => (creep.memory.role === 'hauler'));
        if (hauler.length < 2 || (hauler[0].ticksToLive < 250 && hauler.length < 3)) {
            queueCreep(room, PRIORITIES.hauler, {
                role: 'hauler'
            })
        }
    }
    //SPECIALIZED
    //Waller
    if (level >= 3 && !_.includes(queue, 'waller') && level === room.controller.level) {
        let wallers = _.filter(roomCreeps, (creep) => creep.memory.role === 'waller');
        if (wallers.length < 2) {
            queueCreep(room, PRIORITIES.waller, {
                role: 'waller'
            })
        }
    }
    //Mineral Harvester
    if (level >= 6 && !_.includes(queue, 'mineralHarvester') && level === room.controller.level && !room.memory.responseNeeded) {
        let mineralHarvesters = _.filter(roomCreeps, (creep) => creep.memory.role === 'mineralHarvester');
        let extractor = Game.getObjectById(_.pluck(_.filter(room.memory.structureCache, 'type', 'extractor'), 'id')[0]);
        if (mineralHarvesters.length < 1 && extractor) {
            let minerals = room.mineral[0];
            queueCreep(room, PRIORITIES.mineralHarvester, {
                role: 'mineralHarvester',
                assignedMineral: minerals.id
            })
        }
    }
    // Local Responder
    if (!_.includes(queue, 'responder')) {
        if (room.memory.responseNeeded === true) {
            let responder = _.filter(Game.creeps, (creep) => creep.memory.responseTarget === room.name && creep.memory.role === 'responder');
            if (responder.length < room.memory.numberOfHostiles) {
                queueCreep(room, PRIORITIES.responder, {
                    role: 'responder',
                    responseTarget: room.name,
                    military: true
                })
            }
        }
    }
};

module.exports.remoteCreepQueue = function (room) {
    let level = getLevel(room);
    if (level !== room.controller.level) return;
    let queue = room.memory.creepBuildQueue;
    //Explorer
    if (!_.includes(queue, 'explorer')) {
        let explorers = _.filter(Game.creeps, (creep) => creep.memory.role === 'explorer' && creep.memory.overlord === room.name);
        if (explorers.length < 2) {
            queueCreep(room, PRIORITIES.explorer, {
                role: 'explorer'
            })
        }
    }
    //Remotes
    if (room.memory.remoteRooms && !room.memory.responseNeeded) {
        for (let keys in room.memory.remoteRooms) {
            if (Game.map.findRoute(room.name, room.memory.remoteRooms[keys]).length >= 3 || checkIfSK(room.memory.remoteRooms[keys])) continue;
            let remoteHarvester = _.filter(Game.creeps, (creep) => creep.memory.destination === room.memory.remoteRooms[keys] && creep.memory.role === 'remoteHarvester');
            if (!_.includes(queue, 'remoteHarvester')) {
                let sourceCount = 1;
                if (Memory.roomCache[room.memory.remoteRooms[keys]]) sourceCount = Memory.roomCache[room.memory.remoteRooms[keys]].sources.length;
                if (remoteHarvester.length < sourceCount && (!Game.rooms[room.memory.remoteRooms[keys]] || !Game.rooms[room.memory.remoteRooms[keys]].memory.noRemote)) {
                    queueCreep(room, PRIORITIES.remoteHarvester, {
                        role: 'remoteHarvester',
                        destination: room.memory.remoteRooms[keys]
                    })
                }
            }
            if (!_.includes(queue, 'remoteHauler')) {
                let remoteHauler = _.filter(Game.creeps, (creep) => creep.memory.destination === room.memory.remoteRooms[keys] && creep.memory.role === 'remoteHauler' && creep.memory.overlord === room.name);
                if (remoteHarvester.length > 0 && remoteHauler.length < 1 && Game.map.findRoute(room.name, room.memory.remoteRooms[keys]).length < 2) {
                    queueCreep(room, PRIORITIES.remoteHauler, {
                        role: 'remoteHauler',
                        destination: room.memory.remoteRooms[keys]
                    })
                }
            }
            if (!_.includes(queue, 'pioneer')) {
                let pioneers = _.filter(Game.creeps, (creep) => creep.memory.destination === room.memory.remoteRooms[keys] && creep.memory.role === 'pioneer');
                if (pioneers.length < 1) {
                    queueCreep(room, PRIORITIES.pioneer, {
                        role: 'pioneer',
                        destination: room.memory.remoteRooms[keys]
                    })
                }
            }
            if (!_.includes(queue, 'reserver') && level >= 5) {
                let reserver = _.filter(Game.creeps, (creep) => creep.memory.role === 'reserver' && creep.memory.reservationTarget === room.memory.remoteRooms[keys]);
                if ((reserver.length < 1 || (reserver[0].ticksToLive < 100 && reserver.length < 2)) && (!Game.rooms[room.memory.remoteRooms[keys]] || !Game.rooms[room.memory.remoteRooms[keys]].memory.reservationExpires || Game.rooms[room.memory.remoteRooms[keys]].memory.reservationExpires <= Game.time + 250) && (!Game.rooms[room.memory.remoteRooms[keys]] || !Game.rooms[room.memory.remoteRooms[keys]].memory.noRemote)) {
                    queueCreep(room, PRIORITIES.reserver, {
                        role: 'reserver',
                        reservationTarget: room.memory.remoteRooms[keys]
                    })
                }
            }
            // Remote Response
            if (!_.includes(queue, 'remoteResponse')) {
                if (Game.rooms[room.memory.remoteRooms[keys]] && Game.rooms[room.memory.remoteRooms[keys]].memory.responseNeeded === true && !room.memory.responseNeeded) {
                    let responder = _.filter(Game.creeps, (creep) => creep.memory.responseTarget === room.memory.remoteRooms[keys] && creep.memory.role === 'remoteResponse');
                    if (responder.length < Game.rooms[room.memory.remoteRooms[keys]].memory.numberOfHostiles) {
                        queueCreep(room, PRIORITIES.remoteResponse, {
                            role: 'remoteResponse',
                            responseTarget: room.memory.remoteRooms[keys],
                            military: true
                        })
                    }
                }
            }
        }
    }
    //SK Rooms
    if (level >= 7 && room.memory.skRooms && !room.memory.responseNeeded) {
        for (let key in room.memory.skRooms) {
            let SKRoom = Game.rooms[room.memory.skRooms[key]];
            if (!SKRoom) continue;
            let SKAttacker = _.filter(Game.creeps, (creep) => creep.memory.destination === room.memory.skRooms[key] && creep.memory.role === 'SKattacker' && creep.memory.overlord === room.name);
            let SKworker = _.filter(Game.creeps, (creep) => creep.memory.destination === room.memory.skRooms[key] && creep.memory.role === 'SKworker');
            /**f (!_.includes(queue, 'SKsupport')) {
                let SKSupport = _.filter(Game.creeps, (creep) => creep.memory.destination === room.memory.skRooms[key] && creep.memory.role === 'SKsupport' && creep.memory.overlord === room.name);
                if (((SKSupport.length < 1 || (SKSupport.length === 1 && SKSupport[0].ticksToLive < 100)) && SKAttacker.length > 0) && Game.map.findRoute(room.name, SKRoom.name).length < 2 && (!SKRoom.memory || !SKRoom.memory.noMine)) {
                    queueCreep(room, PRIORITIES.SKsupport, {
                        role: 'SKsupport',
                        destination: room.memory.skRooms[key]
                    })
                }
            }**/
            if (!_.includes(queue, 'SKattacker')) {
                if ((SKAttacker.length < 1 || (SKAttacker.length === 1 && SKAttacker[0].ticksToLive < 250)) && Game.map.findRoute(room.name, SKRoom.name).length < 2 && (!SKRoom.memory || !SKRoom.memory.noMine)) {
                    queueCreep(room, PRIORITIES.SKattacker, {
                        role: 'SKattacker',
                        destination: room.memory.skRooms[key]
                    })
                }
            }
            if (!_.includes(queue, 'SKworker')) {
                if (SKworker.length < Memory.roomCache[room.memory.skRooms[key]].sources.length + 1 && (SKAttacker.length > 0)) {
                    queueCreep(room, PRIORITIES.SKworker, {
                        role: 'SKworker',
                        destination: room.memory.skRooms[key]
                    })
                }
            }
            if (!_.includes(queue, 'remoteHauler')) {
                let SKhauler = _.filter(Game.creeps, (creep) => creep.memory.destination === room.memory.skRooms[key] && creep.memory.role === 'remoteHauler' && creep.memory.overlord === room.name);
                if (SKhauler.length < 2 && (SKAttacker.length > 0)) {
                    queueCreep(room, PRIORITIES.remoteHauler, {
                        role: 'remoteHauler',
                        destination: room.memory.skRooms[key]
                    })
                }
            }
            if (!_.includes(queue, 'pioneer')) {
                let pioneers = _.filter(Game.creeps, (creep) => creep.memory.destination === room.memory.skRooms[key] && creep.memory.role === 'pioneer');
                if (pioneers.length < 1 && (SKAttacker.length > 0)) {
                    queueCreep(room, PRIORITIES.pioneer, {
                        role: 'pioneer',
                        destination: room.memory.skRooms[key]
                    })
                }
            }
        }
    }

    //Claim Stuff
    if (!_.includes(queue, 'claimer') && room.memory.claimTarget) {
        let claimer = _.filter(Game.creeps, (creep) => creep.memory.destination === room.memory.claimTarget && creep.memory.role === 'claimer');
        if (claimer.length < 1 && !_.includes(Memory.ownedRooms, room.memory.claimTarget) && !room.memory.activeClaim) {
            queueCreep(room, 2, {
                role: 'claimer',
                destination: room.memory.claimTarget
            })
        }
        let pioneers = _.filter(Game.creeps, (creep) => creep.memory.destination === room.memory.claimTarget && creep.memory.role === 'pioneer');
        if (!_.includes(queue, 'pioneer') && pioneers.length < -2 + level) {
            queueCreep(room, 2, {
                role: 'pioneer',
                destination: room.memory.claimTarget,
                initialBuilder: true
            })
        }
    }

    // Assist room
    if (!_.includes(queue, 'pioneer') && room.memory.assistingRoom) {
        let pioneers = _.filter(Game.creeps, (creep) => creep.memory.destination === room.memory.assistingRoom && creep.memory.role === 'pioneer');
        if (pioneers.length < -2 + level) {
            queueCreep(room, 2, {
                role: 'pioneer',
                destination: room.memory.assistingRoom,
                initialBuilder: true
            })
        }
    }
    if (!_.includes(queue, 'remoteResponse') && room.memory.sendingResponse) {
        if (Game.rooms[room.memory.sendingResponse] && Game.rooms[room.memory.sendingResponse].memory.responseNeeded === true && !room.memory.responseNeeded) {
            let responder = _.filter(Game.creeps, (creep) => creep.memory.responseTarget === room.memory.sendingResponse && creep.memory.role === 'remoteResponse');
            if (responder.length < Game.rooms[room.memory.sendingResponse].memory.numberOfHostiles) {
                queueCreep(room, 2, {
                    role: 'remoteResponse',
                    responseTarget: room.memory.sendingResponse,
                    military: true
                })
            }
        }
    }
};

module.exports.militaryCreepQueue = function (room) {
    let queue = room.memory.creepBuildQueue;
    let level = getLevel(room);
    // Cleaning
    if (room.memory.cleaningTargets && room.memory.cleaningTargets.length > 0 && !_.includes(queue, 'deconstructor') && level >= 4) {
        for (let key in room.memory.cleaningTargets) {
            let target = room.memory.cleaningTargets[key].name;
            let deconstructor = _.filter(Game.creeps, (creep) => creep.memory.targetRoom === target && creep.memory.role === 'deconstructor');
            if (deconstructor.length < 1) {
                queueCreep(room, PRIORITIES.deconstructor, {
                    role: 'deconstructor',
                    targetRoom: target,
                    operation: 'clean',
                    reboot: true
                })
            }
        }
    }
};

function checkIfSK(roomName) {
    let parsed;
    if (!parsed) {
        parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
    }
    let fMod = parsed[1] % 10;
    let sMod = parsed[2] % 10;
    return !(fMod === 5 && sMod === 5) &&
        ((fMod >= 4) && (fMod <= 6)) &&
        ((sMod >= 4) && (sMod <= 6));
};