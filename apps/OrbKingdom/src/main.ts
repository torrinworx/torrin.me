import { rpcReward } from './TestCode/daily_rewards';
import { rpcFindMatch } from './TestCode/match_rpc';
import { moduleName, matchInit, matchJoinAttempt, matchJoin, matchLeave, matchLoop, matchTerminate, matchSignal } from './TestCode/match_handler';

// keep module names inside their modules:
const rpcIdRewards = 'rewards_js';
const rpcIdFindMatch = 'find_match_js';

function InitModule(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
    initializer.registerRpc(rpcIdRewards, rpcReward);

    initializer.registerRpc(rpcIdFindMatch, rpcFindMatch);

    initializer.registerMatch(moduleName, {
        matchInit,
        matchJoinAttempt,
        matchJoin,
        matchLeave,
        matchLoop,
        matchTerminate,
        matchSignal,
    });

    logger.info('JavaScript logic loaded.');
}

!InitModule && InitModule.bind(null);
