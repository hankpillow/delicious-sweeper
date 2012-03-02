from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.api import urlfetch
from google.appengine.api.urlfetch_errors import *
from google.appengine.runtime import apiproxy_errors

import traceback, logging, cgitb, cgi
import simplejson as json

class MainHandler(webapp.RequestHandler):

	def get(self):
		self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( json.dumps({"status_code":-1,"message":"post only dude!"}) )

	def post(self):

		self.response.headers['Content-Type'] = 'application/json'
		cgitb.enable()
		params = cgi.FieldStorage()

		url = params.getvalue("url")
		if (url == None):
			self.response.out.write( json.dumps({"status_code":-2,"message":"no url given"}) )
			return

		# headers = {'Origin': 'http://localhost:8080', 'Accept-Language': 'en-US,en;q=0.8,pt-BR;q=0.6,pt;q=0.4', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.46 Safari/535.11', 'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3', 'Connection': 'keep-alive', 'Cache-Control': 'max-age=0', 'Content-Type': 'application/x-www-form-urlencoded'}

		response = fetch_status(url)
		self.response.out.write( json.dumps(response) )

def fetch_status( url, headers=None ):
	response = {}
	try:
		result = urlfetch.fetch( url=url, deadline=60, allow_truncated=True, headers=headers)
		response = {"status_code":result.status_code,"url":url}
	except DownloadError, e:
		response = {"status_code":-3, "message":"%s" % e, "url":url}
	except InvalidURLError, e:
		response = {"status_code":-4, "message":"%s" % e, "url":url}
	except ResponseTooLargeError, e:
		response = {"status_code":-5, "message":"%s" % e, "url":url}
	except Exception, e:
		response = {"status_code":-100, "message":"%s" % e, "url":url}
	return response

def main(has_debug=False):
    application = webapp.WSGIApplication([('/fetch', MainHandler)],debug=has_debug)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main(True)