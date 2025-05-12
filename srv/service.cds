// services

using portal.Power.Analytics.PowerBiPortal from '../db/schema';
using auth from './auth';

@requires : 'authenticated-user'
service MyService @(path: 'MyService'){
    type RoleString {
        status : String;
        message : String;
    }
    entity Roles as projection on PowerBiPortal.Roles;
    entity UserRoles as projection on PowerBiPortal.UserRoles;
    entity Companies as projection on PowerBiPortal.Companies;
    @(requires : ['Admin'])
    entity Users as projection on PowerBiPortal.Users;
        // actions {
        //     function updateRoles(roles: array of String) returns RoleString;
        // };
    
    action updateRoles(userId: String, roles: array of String) returns RoleString;
    entity PowerBi as projection on PowerBiPortal.PowerBi;
    entity Identity as projection on PowerBiPortal.Identity;
    entity ReportsExposed as projection on PowerBiPortal.ReportsExposed;
    entity SecurityFiltersType as projection on PowerBiPortal.SecurityFiltersType;
    entity SecurityFilters as projection on PowerBiPortal.SecurityFilters;
    entity DisplaySettings as projection on PowerBiPortal.DisplaySettings;
    entity Configuration as projection on PowerBiPortal.Configuration;

    function getCustomAttrbute() returns auth.CustomAttributes;
}