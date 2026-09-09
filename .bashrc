# Termux Remote Access aliases
alias remote="bash ~/termux-remote/start.sh start"
alias stopremote="bash ~/termux-remote/start.sh stop"
alias restartremote="bash ~/termux-remote/start.sh restart"
alias tunnel="grep -o '[a-z0-9-]*\.trycloudflare\.com' /tmp/tunnel-terminal.log 2>/dev/null | tail -1"
alias tunnelfiles="grep -o '[a-z0-9-]*\.trycloudflare\.com' /tmp/tunnel-files.log 2>/dev/null | tail -1"
