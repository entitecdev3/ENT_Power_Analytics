using from '@sap/cds/common';

namespace auth;

type CustomAttributes {
    configKey: String;
    value: String;
}

type UserInfo {
    username: String;
    roles: Array of String;

}

