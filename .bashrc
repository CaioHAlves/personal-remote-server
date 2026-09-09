# Termux Remote Access aliases
alias remote="bash ~/termux-remote/start.sh start"
alias stopremote="bash ~/termux-remote/start.sh stop"
alias restartremote="bash ~/termux-remote/start.sh restart"
alias tunnel="grep -o 'https://[^ ]*\.serveousercontent\.com' ~/tunnel-terminal.log 2>/dev/null | tail -1"
alias tunnelfiles="grep -o 'https://[^ ]*\.serveousercontent\.com' ~/tunnel-files.log 2>/dev/null | tail -1"
