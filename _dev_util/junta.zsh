#!/bin/bash

# Verifica se o número correto de argumentos foi fornecido
if [ "$#" -ne 2 ]; then
    echo "Uso: $0 diretorio_origem arquivo_saida"
    exit 1
fi

# Diretório onde os arquivos .js estão localizados
diretorio_origem="$1"

# Arquivo de texto de saída
arquivo_saida="$2"

# Limpa o arquivo de saída, caso exista
> "$arquivo_saida"

# Loop pelos arquivos .js no diretório de origem
for arquivo_js in "$diretorio_origem"/*.js; do
    # Obtém o nome do arquivo sem o path
    nome_arquivo=$(basename "$arquivo_js")

    # Adiciona o nome do arquivo ao arquivo de saída
    echo "File $nome_arquivo:" >> "$arquivo_saida"

    # Obtém o caminho completo do arquivo
    caminho_completo=$(realpath "$arquivo_js")

    # Adiciona o comentário com o caminho do arquivo ao arquivo de saída
    echo "# $caminho_completo" >> "$arquivo_saida"
    
    # Adiciona o conteúdo do arquivo .js ao arquivo de saída
    cat "$arquivo_js" >> "$arquivo_saida"

    # Adiciona uma linha em branco após cada arquivo
    echo "" >> "$arquivo_saida"
done

echo "Concatenação concluída. Arquivo de saída: $arquivo_saida"
