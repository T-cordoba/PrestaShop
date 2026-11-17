import $ from 'jquery';

// The BO components read jQuery from window when their module loads.
Object.assign(window, {$, jQuery: $});
