SET NSSM_DIR=D:\Projects_DEV\ENT_Power_Analytics
REM !! SENZA SPAZI !!
SET SERVICE_NAME="ENT_Power_Analytics"


REM The UI Service cannot run under LOCALSYSTEM (unfortunately) , thus we must provide real windows user credentials for LogonAs.
REM Can be local user (preferred) or domain user . The user should NOT CHANGE PASSWORD , otherwise this service will not be stable in time.
SET WIN_USER_NAME=".\Administrator"
SET WIN_USER_PASSWORD="SAPB1Admin"

SET SERVICE_LOG=%NSSM_DIR%\service_console.txt
SET LAUNCHER=%NSSM_DIR%\launch_analytics.bat

mkdir c:\temp
REM %NSSM_DIR%\nssm install %NODE_RED_SERVICE_NAME% "c:\Users\\"%USERNAME%"\AppData\Roaming\npm\%NODE_RED_SERVICE_NAME%.cmd"
%NSSM_DIR%\nssm install %SERVICE_NAME% "%LAUNCHER%"
%NSSM_DIR%\nssm set %SERVICE_NAME% AppDirectory "%NSSM_DIR%"
%NSSM_DIR%\nssm set %SERVICE_NAME% AppParameters " > %SERVICE_LOG%"
%NSSM_DIR%\nssm set %SERVICE_NAME% Description %SERVICE_NAME%
