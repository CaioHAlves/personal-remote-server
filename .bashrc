# Termux Remote Access aliases
alias remote="bash ~/start.sh start"
alias stopremote="bash ~/start.sh stop"
alias restartremote="bash ~/start.sh restart"
alias tunnel="grep -o 'https://[^ ]*\.serveousercontent\.com' ~/tunnel-terminal.log 2>/dev/null | tail -1"
alias tunnelfiles="grep -o 'https://[^ ]*\.serveousercontent\.com' ~/tunnel-files.log 2>/dev/null | tail -1"

# Keep-alive monitor
alias keepalive="bash ~/keepalive-monitor.sh start"
alias stopkeepalive="bash ~/keepalive-monitor.sh stop"
alias statuskeepalive="bash ~/keepalive-monitor.sh status"
