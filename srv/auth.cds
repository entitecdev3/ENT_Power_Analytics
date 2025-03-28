using from '@sap/cds/common';

namespace auth;

type CustomAttributes {
    configKey: String;
    value: String;
}

function getCustomAttrbute() returns CustomAttributes;

